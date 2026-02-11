"""
YOLOv8 vehicle detection helper.

This module provides a reusable `YoloVehicleDetector` class that:
- Loads a YOLOv8 model (pretrained on COCO by default)
- Detects vehicles (car, motorbike, bus, truck, bicycle if desired)
- Returns structured detection results and an annotated frame

It also exposes a small CLI demo so you can quickly test detection on:
- A video file:  python -m detection.yolo_detector --source data/videos/test.mp4
- Webcam:       python -m detection.yolo_detector --source 0
"""

from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple, Union

import cv2
import numpy as np
import torch
from ultralytics import YOLO


BBox = Tuple[int, int, int, int]  # (x1, y1, x2, y2)


@dataclass
class Detection:
    """
    Simple container for a single detection.
    """

    class_id: int
    class_name: str
    confidence: float
    bbox: BBox


class YoloVehicleDetector:
    """
    Wrapper around the Ultralytics YOLOv8 model for vehicle detection.

    Usage (from Python code):
        detector = YoloVehicleDetector()
        vehicles, annotated = detector.detect_vehicles(frame)
    """

    # COCO class IDs for vehicles (YOLOv8 default model trained on COCO)
    # Reference mapping:
    #  1: bicycle, 2: car, 3: motorcycle, 5: bus, 7: truck
    DEFAULT_VEHICLE_CLASS_IDS = {1, 2, 3, 5, 7}

    def __init__(
        self,
        model_path: str = "yolov8n.pt",
        device: Optional[str] = None,
        conf_threshold: float = 0.4,
        vehicle_class_ids: Optional[set[int]] = None,
    ):
        """
        :param model_path: Path or name of YOLOv8 model (e.g., 'yolov8n.pt', 'yolov8s.pt').
        :param device: 'cuda', 'cpu', or None (auto-detect).
        :param conf_threshold: Minimum confidence score for detections.
        :param vehicle_class_ids: Set of class IDs to treat as vehicles.
        """
        self.model_path = model_path
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.conf_threshold = conf_threshold
        self.vehicle_class_ids = vehicle_class_ids or self.DEFAULT_VEHICLE_CLASS_IDS

        self.model: YOLO = YOLO(self.model_path)
        self.model.to(self.device)

        # Mapping of class id -> name (e.g., 2 -> "car")
        self.class_names: Dict[int, str] = self.model.names

    def detect_vehicles(
        self,
        frame: np.ndarray,
        draw: bool = True,
        color: Tuple[int, int, int] = (0, 255, 0),
    ) -> Tuple[List[Detection], np.ndarray]:
        """
        Run YOLOv8 inference on a single frame and return:
            - a list of Detection objects for vehicles only
            - an annotated frame (original frame with bounding boxes & labels)

        :param frame: BGR image (as returned by cv2.VideoCapture.read()).
        :param draw: Whether to draw bounding boxes on the frame.
        :param color: Box/label color in BGR.
        """
        if frame is None:
            return [], frame

        # Run inference
        results = self.model(
            frame,
            conf=self.conf_threshold,
            verbose=False,
            device=self.device,
        )

        # Ultralytics API returns a list; we take the first (single image)
        result = results[0]

        detections: List[Detection] = []
        annotated_frame = frame.copy()

        if not hasattr(result, "boxes") or result.boxes is None:
            return detections, annotated_frame

        for box in result.boxes:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])

            if cls_id not in self.vehicle_class_ids:
                continue

            x1, y1, x2, y2 = map(int, box.xyxy[0])
            name = self.class_names.get(cls_id, str(cls_id))

            det = Detection(
                class_id=cls_id,
                class_name=name,
                confidence=conf,
                bbox=(x1, y1, x2, y2),
            )
            detections.append(det)

            if draw:
                label = f"{name} {conf:.2f}"
                cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), color, 2)
                # Draw label above the box
                (tw, th), _ = cv2.getTextSize(
                    label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1
                )
                cv2.rectangle(
                    annotated_frame,
                    (x1, max(0, y1 - th - 4)),
                    (x1 + tw + 2, y1),
                    color,
                    -1,
                )
                cv2.putText(
                    annotated_frame,
                    label,
                    (x1 + 1, y1 - 3),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.5,
                    (0, 0, 0),
                    1,
                    cv2.LINE_AA,
                )

        return detections, annotated_frame

    def process_video(
        self,
        source: Union[int, str] = 0,
        display: bool = True,
        save_path: Optional[str] = None,
        max_frames: Optional[int] = None,
    ) -> None:
        """
        Run detection on a video file or webcam.

        :param source: Video path or camera index (0 for default webcam).
        :param display: Show annotated frames in a window.
        :param save_path: If provided, write an output video with annotations.
        :param max_frames: Optional limit on frames for quick tests.
        """
        cap = cv2.VideoCapture(source)
        if not cap.isOpened():
            raise RuntimeError(f"Could not open video source: {source}")

        writer = None
        if save_path is not None:
            fourcc = cv2.VideoWriter_fourcc(*"mp4v")
            fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            writer = cv2.VideoWriter(save_path, fourcc, fps, (width, height))

        frame_count = 0
        last_time = time.time()

        while True:
            ret, frame = cap.read()
            if not ret or frame is None:
                break

            detections, annotated = self.detect_vehicles(frame)
            frame_count += 1

            # Simple FPS estimate
            now = time.time()
            elapsed = now - last_time
            if elapsed > 0:
                fps = 1.0 / elapsed
            else:
                fps = 0.0
            last_time = now

            cv2.putText(
                annotated,
                f"FPS: {fps:.1f} | Vehicles: {len(detections)}",
                (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                (0, 255, 255),
                2,
                cv2.LINE_AA,
            )

            if display:
                cv2.imshow("YOLOv8 Vehicle Detection", annotated)
                # Press 'q' to quit
                if cv2.waitKey(1) & 0xFF == ord("q"):
                    break

            if writer is not None:
                writer.write(annotated)

            if max_frames is not None and frame_count >= max_frames:
                break

        cap.release()
        if writer is not None:
            writer.release()
        if display:
            cv2.destroyAllWindows()


def _parse_args():
    import argparse

    parser = argparse.ArgumentParser(
        description="YOLOv8 vehicle detection demo (video/webcam)."
    )
    parser.add_argument(
        "--source",
        type=str,
        default="0",
        help="Video file path or camera index (default: 0 for webcam).",
    )
    parser.add_argument(
        "--model",
        type=str,
        default="yolov8n.pt",
        help="YOLOv8 model path/name (yolov8n.pt, yolov8s.pt, etc.).",
    )
    parser.add_argument(
        "--conf",
        type=float,
        default=0.4,
        help="Confidence threshold (default: 0.4).",
    )
    parser.add_argument(
        "--no-display",
        action="store_true",
        help="Disable display window (useful on headless servers).",
    )
    parser.add_argument(
        "--save-path",
        type=str,
        default=None,
        help="Optional output video path (e.g., data/videos/output.mp4).",
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

    detector = YoloVehicleDetector(
        model_path=args.model,
        conf_threshold=args.conf,
    )

    detector.process_video(
        source=source,
        display=not args.no_display,
        save_path=args.save_path,
        max_frames=args.max_frames,
    )


if __name__ == "__main__":
    main()



