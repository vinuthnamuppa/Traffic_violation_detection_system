"""
Red-light / stop-line violation logic.

This module defines a **virtual stop-line** in image coordinates and checks
whether vehicles cross this line while the traffic signal is red.

It is designed to work together with the `TrackedVehicle` objects from
`speed_detection.SimpleSpeedTracker`, but can also work with raw bounding boxes.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional, Set, Tuple

import cv2
import numpy as np

from .speed_detection import TrackedVehicle


BBox = Tuple[int, int, int, int]


@dataclass
class SignalConfig:
    """
    Configuration for the virtual stop-line and signal state.

    Attributes:
        stop_line_y:        Y-coordinate (row) of the virtual stop-line in pixels.
                            This is a horizontal line across the frame.
        red_light_active:   Whether the signal is currently red.
        line_color:         BGR color of the line when drawing.
        line_thickness:     Thickness of the drawn line.
    """

    stop_line_y: int
    red_light_active: bool = True
    line_color: Tuple[int, int, int] = (0, 0, 255)  # Red line
    line_thickness: int = 2


@dataclass
class SignalViolationEvent:
    """
    Represents one red-light violation by a tracked vehicle.

    Attributes:
        track_id:    ID of the `TrackedVehicle` that violated the rule.
        frame_index: Index of the frame where violation was detected.
        timestamp:   Time (seconds) when violation occurred.
    """

    track_id: int
    frame_index: int
    timestamp: float


class SignalViolationDetector:
    """
    Detects red-light / stop-line violations.

    Basic rule:
      - If the signal is red (config.red_light_active is True) AND
      - The vehicle was previously **before** the stop-line and now its
        bounding-box bottom is **beyond** the stop-line,
      - Then we register a violation for that vehicle (once).
    """

    def __init__(self, config: SignalConfig):
        self.config = config
        # Keep track of which vehicle IDs already violated to avoid duplicates
        self._violated_ids: Set[int] = set()

    def has_crossed_stop_line(self, bbox: BBox) -> bool:
        """
        Check if the bottom of the bounding box has crossed the stop-line.

        :param bbox: (x1, y1, x2, y2)
        """
        _, _, _, y2 = bbox
        return y2 > self.config.stop_line_y

    def update_light_state(self, is_red: bool) -> None:
        """
        Update the current signal state (red / not red).
        """
        self.config.red_light_active = is_red

    def check_track_violation(
        self,
        track: TrackedVehicle,
        frame_index: int,
        timestamp: float,
    ) -> Optional[SignalViolationEvent]:
        """
        Check if a single tracked vehicle has just violated the red-light rule.

        We consider it a violation if:
        - Signal is red, AND
        - Track has not violated before, AND
        - Previously centroid was above the stop-line, and now bbox bottom is below it.
        """
        if not self.config.red_light_active:
            return None

        if track.id in self._violated_ids:
            return None

        x1, y1, x2, y2 = track.bbox

        # Check if the vehicle is now beyond the line
        now_beyond = y2 > self.config.stop_line_y

        # Check if previously it was before the line.
        # We use history of centroids; if any previous centroid is above the line,
        # and now the bbox bottom is below, we consider it a crossing.
        was_before = False
        for (_, cy) in track.history:
            if cy <= self.config.stop_line_y:
                was_before = True
                break

        if was_before and now_beyond:
            self._violated_ids.add(track.id)
            return SignalViolationEvent(
                track_id=track.id, frame_index=frame_index, timestamp=timestamp
            )

        return None

    def check_violations(
        self,
        tracks: List[TrackedVehicle],
        frame_index: int,
        timestamp: float,
    ) -> List[SignalViolationEvent]:
        """
        Check all tracks in the current frame and return newly detected violations.
        """
        events: List[SignalViolationEvent] = []
        for track in tracks:
            event = self.check_track_violation(track, frame_index, timestamp)
            if event is not None:
                events.append(event)
        return events

    def draw_stop_line(self, frame: np.ndarray) -> np.ndarray:
        """
        Draw the virtual stop-line and its state (RED/GREEN) on the frame.
        """
        annotated = frame.copy()
        h, w = annotated.shape[:2]
        y = self.config.stop_line_y

        cv2.line(
            annotated,
            (0, y),
            (w, y),
            self.config.line_color,
            self.config.line_thickness,
        )

        status_text = "RED SIGNAL - STOP" if self.config.red_light_active else "GREEN"
        cv2.putText(
            annotated,
            status_text,
            (10, max(20, y - 10)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            self.config.line_color,
            2,
            cv2.LINE_AA,
        )
        return annotated


