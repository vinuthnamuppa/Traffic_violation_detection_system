"""
End-to-end video processing pipeline.

This script ties together:
- YOLOv8 vehicle detection
- SimpleSpeedTracker (speed estimation)
- SignalViolationDetector (red-light / stop-line)
- NumberPlateOCR (EasyOCR)
- MongoDB Violation model

Usage examples (from project root `traffic_violation_system`):

  # Process a recorded video
  python -m detection.video_pipeline --source data/videos/sample.mp4

  # Use webcam (index 0)
  python -m detection.video_pipeline --source 0

New violations are:
- Saved as snapshot images under `data/snapshots/`
- Inserted into MongoDB `violations` collection
and can be viewed on the dashboard at `/dashboard`.
"""

from __future__ import annotations

import os
import time
from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Set, Tuple, Union

import cv2
from dotenv import load_dotenv

from backend.models.violation import Violation, insert_violation
from detection.ocr import NumberPlateOCR
from detection.signal_violation import (
    SignalConfig,
    SignalViolationDetector,
    SignalViolationEvent,
)
from detection.speed_detection import SimpleSpeedTracker, TrackedVehicle
from detection.yolo_detector import YoloVehicleDetector


load_dotenv()  # Load .env so we can use SPEED_LIMIT_KMPH, STOP_LINE_Y, etc.


SNAPSHOT_DIR = os.path.join("data", "snapshots")
os.makedirs(SNAPSHOT_DIR, exist_ok=True)


@dataclass
class PipelineConfig:
    speed_limit_kmph: float
    stop_line_y: int
    ocr_min_conf: float = 0.3


def load_config() -> PipelineConfig:
    """
    Read configuration from environment variables with sensible defaults.
    """
    speed_limit = float(os.getenv("SPEED_LIMIT_KMPH", "60"))
    stop_line_y = int(os.getenv("STOP_LINE_Y", "350"))
    ocr_min_conf = float(os.getenv("OCR_MIN_CONF", "0.3"))
    return PipelineConfig(
        speed_limit_kmph=speed_limit,
        stop_line_y=stop_line_y,
        ocr_min_conf=ocr_min_conf,
    )


def save_snapshot(frame, bbox, prefix: str, frame_index: int) -> str:
    """
    Save a cropped snapshot of the vehicle to the snapshots folder.

    :param frame:       Full BGR frame.
    :param bbox:        (x1, y1, x2, y2) of vehicle.
    :param prefix:      'overspeed' or 'signal' etc.
    :param frame_index: Current frame index.
    :return:            Public snapshot URL path (e.g. '/snapshots/xxx.jpg') to store in DB.
    """
    h, w = frame.shape[:2]
    x1, y1, x2, y2 = bbox
    x1 = max(0, x1)
    y1 = max(0, y1)
    x2 = min(w - 1, x2)
    y2 = min(h - 1, y2)

    crop = frame[y1:y2, x1:x2]
    timestamp_str = datetime.utcnow().strftime("%Y%m%d_%H%M%S_%f")
    filename = f"{prefix}_{timestamp_str}_f{frame_index}.jpg"
    save_path = os.path.join(SNAPSHOT_DIR, filename)

    if crop.size > 0:
        cv2.imwrite(save_path, crop)

    # Public URL path served by Flask (see /snapshots/<filename> route)
    return f"/snapshots/{filename}"


def save_plate_image(plate_roi, prefix: str, frame_index: int) -> Optional[str]:
    """
    Save cropped number plate image to snapshots folder.

    :param plate_roi:      Cropped plate region (BGR image).
    :param prefix:         Prefix for filename (e.g., 'overspeed' or 'signal').
    :param frame_index:    Current frame index.
    :return:               Public snapshot URL path or None if plate_roi is invalid.
    """
    if plate_roi is None or plate_roi.size == 0:
        return None

    timestamp_str = datetime.utcnow().strftime("%Y%m%d_%H%M%S_%f")
    filename = f"{prefix}_plate_{timestamp_str}_f{frame_index}.jpg"
    save_path = os.path.join(SNAPSHOT_DIR, filename)

    cv2.imwrite(save_path, plate_roi)
    return f"/snapshots/{filename}"


def handle_violation(
    frame,
    track: TrackedVehicle,
    violation_type: str,
    frame_index: int,
    ocr: NumberPlateOCR,
    cfg: PipelineConfig,
) -> None:
    """
    Given a violating track, perform:
      - Snapshot saving (full vehicle)
      - Number plate OCR with enhanced preprocessing
      - Save cropped plate image
      - MongoDB insertion with plate image path and confidence
    """
    snapshot_path = save_snapshot(frame, track.bbox, prefix=violation_type, frame_index=frame_index)

    # OCR on vehicle (returns plate_text, confidence, and cropped plate_roi)
    plate_text, ocr_conf, plate_roi = ocr.read_plate_from_vehicle(frame, track.bbox)

    # Save cropped plate image if available
    plate_image_path = None
    if plate_roi is not None:
        plate_image_path = save_plate_image(plate_roi, prefix=violation_type, frame_index=frame_index)

    # Log OCR result for debugging
    print(
        f"[OCR] track {track.id}: plate='{plate_text}' conf={ocr_conf:.2f} "
        f"(min_conf={cfg.ocr_min_conf})"
    )

    # If OCR finds something, store it even if confidence is low;
    # frontend/report can still decide how to interpret it.
    vehicle_number = plate_text or ""

    # Enhanced extra metadata: store plate image path and OCR details
    extra_metadata = {
        "track_id": track.id,
        "ocr_confidence": ocr_conf,
        "ocr_low_confidence": ocr_conf < cfg.ocr_min_conf,
    }
    if plate_image_path:
        extra_metadata["plate_image_path"] = plate_image_path

    violation = Violation(
        vehicle_number=vehicle_number,
        violation_type=violation_type,
        speed_kmph=track.speed_kmph,
        timestamp=datetime.utcnow(),
        snapshot_path=snapshot_path,
        extra=extra_metadata,
    )
    inserted_id = insert_violation(violation)
    print(
        f"[DB] Inserted violation {violation_type} for track {track.id}, "
        f"vehicle={vehicle_number or 'UNKNOWN'}, speed={track.speed_kmph:.1f} km/h, id={inserted_id}"
    )


def run_pipeline(
    source: Union[int, str],
    display: bool = True,
    max_frames: Optional[int] = None,
) -> None:
    """
    Main processing loop:
    - Read frames from source
    - Run YOLO detection
    - Track vehicles and compute speed
    - Detect overspeeding and signal jump violations
    - OCR and insert records into MongoDB
    """
    cfg = load_config()

    # Initialize modules
    detector = YoloVehicleDetector(conf_threshold=0.4)
    speed_tracker = SimpleSpeedTracker()
    signal_detector = None

    ocr = NumberPlateOCR(languages=["en"], gpu=False)

    # We'll lazily create SignalViolationDetector when we know frame size
    cap = cv2.VideoCapture(source)
    if not cap.isOpened():
        raise RuntimeError(f"Could not open video source: {source}")

    frame_index = 0
    last_time = time.time()

    # To avoid repeated DB inserts for same track/violation type
    overspeed_recorded: Set[int] = set()

    while True:
        ret, frame = cap.read()
        if not ret or frame is None:
            break

        if signal_detector is None:
            # Initialize stop-line detector based on first frame height if needed
            h, _ = frame.shape[:2]
            stop_line_y = cfg.stop_line_y
            if stop_line_y >= h:
                stop_line_y = int(h * 0.6)
            s_cfg = SignalConfig(stop_line_y=stop_line_y, red_light_active=True)
            signal_detector = SignalViolationDetector(s_cfg)
            print(f"[Init] Using stop_line_y={stop_line_y}")

        # YOLO vehicle detection
        detections, _ = detector.detect_vehicles(frame, draw=False)

        now = time.time()
        tracks = speed_tracker.update(detections, timestamp=now)

        # Detect overspeeding
        for track in tracks:
            if track.is_overspeeding and track.id not in overspeed_recorded:
                overspeed_recorded.add(track.id)
                print(
                    f"[OverSpeed] Track {track.id} at {track.speed_kmph:.1f} km/h "
                    f"(limit {cfg.speed_limit_kmph} km/h)"
                )
                handle_violation(
                    frame=frame,
                    track=track,
                    violation_type="over_speeding",
                    frame_index=frame_index,
                    ocr=ocr,
                    cfg=cfg,
                )

        # Detect signal jump violations
        signal_events = signal_detector.check_violations(
            tracks=tracks,
            frame_index=frame_index,
            timestamp=now,
        )
        for ev in signal_events:
            # Find the corresponding track (it should exist in current list)
            t = next((tr for tr in tracks if tr.id == ev.track_id), None)
            if t is None:
                continue
            print(f"[SignalJump] Track {t.id} at frame {ev.frame_index}")
            handle_violation(
                frame=frame,
                track=t,
                violation_type="signal_jump",
                frame_index=frame_index,
                ocr=ocr,
                cfg=cfg,
            )

        # Drawing overlays: stop-line and speed labels
        annotated = frame
        if signal_detector is not None:
            annotated = signal_detector.draw_stop_line(annotated)
        annotated = SimpleSpeedTracker.draw_tracks(annotated, tracks)

        # FPS overlay
        elapsed = now - last_time
        fps = 1.0 / elapsed if elapsed > 0 else 0.0
        last_time = now
        cv2.putText(
            annotated,
            f"FPS: {fps:.1f}",
            (10, 25),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 255, 255),
            2,
            cv2.LINE_AA,
        )

        if display:
            cv2.imshow("Traffic Violation Pipeline", annotated)
            if cv2.waitKey(1) & 0xFF == ord("q"):
                break

        frame_index += 1
        if max_frames is not None and frame_index >= max_frames:
            break

    cap.release()
    if display:
        cv2.destroyAllWindows()


def _parse_args():
    import argparse

    parser = argparse.ArgumentParser(
        description="End-to-end traffic violation detection pipeline."
    )
    parser.add_argument(
        "--source",
        type=str,
        default="0",
        help="Video file path or camera index (default: 0 for webcam).",
    )
    parser.add_argument(
        "--no-display",
        action="store_true",
        help="Disable display window.",
    )
    parser.add_argument(
        "--max-frames",
        type=int,
        default=None,
        help="Optional max number of frames to process (for quick tests).",
    )
    return parser.parse_args()


def main():
    args = _parse_args()

    # Interpret numeric strings like "0" or "1" as webcam indices
    try:
        source: Union[int, str] = int(args.source)
    except ValueError:
        source = args.source

    run_pipeline(
        source=source,
        display=not args.no_display,
        max_frames=args.max_frames,
    )


if __name__ == "__main__":
    main()


