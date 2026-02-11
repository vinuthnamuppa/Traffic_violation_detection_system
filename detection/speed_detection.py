"""
Speed detection logic.

This module provides two main pieces for Phase 3:

1. `SpeedEstimator` – converts pixel distance and time into real-world speed (km/h).
2. `SimpleSpeedTracker` – roughly tracks vehicles across frames using centroid
   distance and estimates their speed using `SpeedEstimator`.

Notes (important for academic explanations):
- In a real deployment, you must **calibrate** `pixels_per_meter` based on
  camera position, road width, etc. Here we use a configurable approximation.
- This is a **simple educational tracker**, not a production-grade tracker like
  SORT/DeepSORT or YOLO's built-in ByteTrack. It is enough to demonstrate the
  idea of speed calculation in a student project.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

import cv2
import numpy as np


BBox = Tuple[int, int, int, int]  # (x1, y1, x2, y2)


class SpeedEstimator:
    def __init__(self, pixels_per_meter: float = 8.0, speed_limit_kmph: float = 60.0):
        """
        :param pixels_per_meter: Calibration value converting pixel distance to meters.
                                 Higher value => more pixels for 1 real meter.
        :param speed_limit_kmph: Speed limit to flag violations.
        """
        self.pixels_per_meter = pixels_per_meter
        self.speed_limit_kmph = speed_limit_kmph

    def estimate_speed(self, pixel_distance: float, time_seconds: float) -> float:
        """
        Convert pixel movement over time to km/h.

        Formula:
            distance_meters = pixel_distance / pixels_per_meter
            speed_mps       = distance_meters / time_seconds
            speed_kmph      = speed_mps * 3.6
        """
        if time_seconds <= 0:
            return 0.0

        distance_meters = pixel_distance / self.pixels_per_meter
        speed_mps = distance_meters / time_seconds
        speed_kmph = speed_mps * 3.6
        return speed_kmph

    def is_overspeeding(self, speed_kmph: float) -> bool:
        """
        Check if a given speed exceeds the configured limit.
        """
        return speed_kmph > self.speed_limit_kmph


@dataclass
class TrackedVehicle:
    """
    Represents a single tracked vehicle across frames.

    Attributes:
        id:               Unique ID assigned by tracker.
        bbox:             Latest bounding box (x1, y1, x2, y2).
        centroid:         Latest centroid (cx, cy) in pixels.
        last_seen_time:   Timestamp of the last update (seconds).
        speed_kmph:       Latest estimated speed.
        is_overspeeding:  True if current speed exceeds limit.
        history:          Optional list of previous centroids (for visualization).
    """

    id: int
    bbox: BBox
    centroid: Tuple[float, float]
    last_seen_time: float
    speed_kmph: float = 0.0
    is_overspeeding: bool = False
    history: List[Tuple[float, float]] = field(default_factory=list)


class SimpleSpeedTracker:
    """
    Very simple centroid-based tracker + speed calculator.

    How it works (high level):
    - For each frame, you pass in a list of detections (e.g. YOLO vehicle boxes).
    - We compute the centroid of each detection.
    - We match current centroids to previous centroids by nearest distance.
    - For matched objects, we compute pixel distance moved and divide by
      time difference to estimate speed (km/h) using `SpeedEstimator`.
    """

    def __init__(
        self,
        speed_estimator: Optional[SpeedEstimator] = None,
        max_match_distance: float = 50.0,
        max_lost_time: float = 1.0,
    ):
        """
        :param speed_estimator: Instance of SpeedEstimator; created with defaults if None.
        :param max_match_distance: Max pixel distance to associate a detection with an existing track.
        :param max_lost_time: Remove tracks that are not seen for more than this many seconds.
        """
        self.speed_estimator = speed_estimator or SpeedEstimator()
        self.max_match_distance = max_match_distance
        self.max_lost_time = max_lost_time

        self._next_id = 1
        self.tracks: Dict[int, TrackedVehicle] = {}

    @staticmethod
    def _bbox_centroid(bbox: BBox) -> Tuple[float, float]:
        x1, y1, x2, y2 = bbox
        cx = (x1 + x2) / 2.0
        cy = (y1 + y2) / 2.0
        return cx, cy

    @staticmethod
    def _euclidean(p1: Tuple[float, float], p2: Tuple[float, float]) -> float:
        return math.hypot(p1[0] - p2[0], p1[1] - p2[1])

    def _create_track(self, bbox: BBox, timestamp: float) -> TrackedVehicle:
        cx, cy = self._bbox_centroid(bbox)
        track = TrackedVehicle(
            id=self._next_id,
            bbox=bbox,
            centroid=(cx, cy),
            last_seen_time=timestamp,
            history=[(cx, cy)],
        )
        self.tracks[self._next_id] = track
        self._next_id += 1
        return track

    def update(
        self,
        detections: List[Any],
        timestamp: float,
    ) -> List[TrackedVehicle]:
        """
        Update tracker with detections for the current frame.

        :param detections: List of detection-like objects. Each item should have
                           a `.bbox` attribute or be a dict with key 'bbox' that
                           stores (x1, y1, x2, y2).
                           This is intentionally flexible so we can pass YOLO
                           `Detection` objects from `yolo_detector.py`.
        :param timestamp:  Current time in seconds (e.g. `time.time()`).
        :return:           List of updated active tracks.
        """
        # 1. Extract bounding boxes from detections
        current_boxes: List[BBox] = []
        for det in detections:
            bbox = getattr(det, "bbox", None)
            if bbox is None and isinstance(det, dict):
                bbox = det.get("bbox")
            if bbox is None:
                continue
            current_boxes.append(bbox)

        # 2. Mark all current tracks as unmatched initially
        unmatched_track_ids = set(self.tracks.keys())

        # 3. Match detections to existing tracks based on centroid distance
        for bbox in current_boxes:
            cx, cy = self._bbox_centroid(bbox)

            best_track_id: Optional[int] = None
            best_distance = float("inf")

            for track_id in list(unmatched_track_ids):
                track = self.tracks[track_id]
                dist = self._euclidean((cx, cy), track.centroid)
                if dist < best_distance and dist <= self.max_match_distance:
                    best_distance = dist
                    best_track_id = track_id

            if best_track_id is None:
                # No match: create new track
                self._create_track(bbox, timestamp)
            else:
                # Match found: update existing track and estimate speed
                track = self.tracks[best_track_id]
                unmatched_track_ids.discard(best_track_id)

                old_centroid = track.centroid
                new_centroid = (cx, cy)
                pixel_distance = self._euclidean(old_centroid, new_centroid)

                dt = timestamp - track.last_seen_time
                speed_kmph = self.speed_estimator.estimate_speed(pixel_distance, dt)

                track.bbox = bbox
                track.centroid = new_centroid
                track.last_seen_time = timestamp
                track.speed_kmph = speed_kmph
                track.is_overspeeding = self.speed_estimator.is_overspeeding(speed_kmph)
                track.history.append(new_centroid)

        # 4. Remove tracks that have been lost for too long
        to_delete: List[int] = []
        for track_id, track in self.tracks.items():
            if timestamp - track.last_seen_time > self.max_lost_time:
                to_delete.append(track_id)
        for track_id in to_delete:
            self.tracks.pop(track_id, None)

        return list(self.tracks.values())

    @staticmethod
    def draw_tracks(frame: np.ndarray, tracks: List[TrackedVehicle]) -> np.ndarray:
        """
        Draw bounding boxes and speed labels for each tracked vehicle.

        :param frame:  BGR image to draw on.
        :param tracks: List of TrackedVehicle objects.
        :return:       Annotated frame.
        """
        annotated = frame.copy()

        for track in tracks:
            x1, y1, x2, y2 = track.bbox

            # Choose color based on overspeeding flag
            if track.is_overspeeding:
                color = (0, 0, 255)  # Red for violation
            else:
                color = (0, 255, 0)  # Green otherwise

            cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)

            label = f"ID {track.id} | {track.speed_kmph:.1f} km/h"
            (tw, th), _ = cv2.getTextSize(
                label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1
            )
            cv2.rectangle(
                annotated,
                (x1, max(0, y1 - th - 4)),
                (x1 + tw + 2, y1),
                color,
                -1,
            )
            cv2.putText(
                annotated,
                label,
                (x1 + 1, y1 - 3),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (0, 0, 0),
                1,
                cv2.LINE_AA,
            )

        return annotated


