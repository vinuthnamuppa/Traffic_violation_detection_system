"""
Number plate OCR module using EasyOCR.

This module provides:

- A helper to *crop a probable plate region* from a vehicle bounding box.
- EasyOCR-based *text extraction* from the cropped image.
- Simple *post-processing* to clean and normalize plate numbers.

For a B.Tech project, this heuristic (crop from lower-middle of vehicle bbox)
is usually sufficient to demonstrate the full pipeline:
YOLO (vehicle) → crop plate region → OCR → cleaned plate string.
"""

from __future__ import annotations

import re
from typing import List, Optional, Tuple

import cv2
import numpy as np
import easyocr


BBox = Tuple[int, int, int, int]  # (x1, y1, x2, y2)


class NumberPlateOCR:
    """
    Number plate OCR wrapper.

    Usage example (conceptual):
        ocr = NumberPlateOCR()
        plate_roi = ocr.crop_plate_from_vehicle(frame, vehicle_bbox)
        text, conf = ocr.read_plate(plate_roi)
    """

    def __init__(
        self,
        languages: Optional[List[str]] = None,
        gpu: bool = False,
    ):
        """
        :param languages: List of language codes for EasyOCR (default: ['en']).
        :param gpu:       Whether to use GPU for OCR if available.
        """
        if languages is None:
            languages = ["en"]

        # Initialize EasyOCR reader once – it is heavy, so reuse this instance.
        self.reader = easyocr.Reader(lang_list=languages, gpu=gpu, verbose=False)

    # ------------------------------------------------------------------
    # Plate region extraction (heuristic)
    # ------------------------------------------------------------------
    @staticmethod
    def crop_plate_from_vehicle(
        frame: np.ndarray,
        vehicle_bbox: BBox,
        vertical_fraction: Tuple[float, float] = (0.5, 1.0),
        horizontal_margin: float = 0.05,
    ) -> Optional[np.ndarray]:
        """
        Heuristically crop the probable plate region from a vehicle bbox.

        We assume the number plate is roughly in the *lower* part
        of the vehicle bounding box.

        :param frame:             Full BGR frame.
        :param vehicle_bbox:      (x1, y1, x2, y2) of the detected vehicle.
        :param vertical_fraction: (start, end) fraction of bbox height to keep.
        :param horizontal_margin: Fraction of width to cut from left & right.
        :return:                  Cropped BGR plate ROI or None if invalid.
        """
        h, w = frame.shape[:2]
        x1, y1, x2, y2 = vehicle_bbox

        x1 = max(0, x1)
        y1 = max(0, y1)
        x2 = min(w - 1, x2)
        y2 = min(h - 1, y2)

        if x2 <= x1 or y2 <= y1:
            return None

        veh_roi = frame[y1:y2, x1:x2]
        vh, vw = veh_roi.shape[:2]

        vy1 = int(vh * vertical_fraction[0])
        vy2 = int(vh * vertical_fraction[1])

        hx_margin = int(vw * horizontal_margin)
        vx1 = hx_margin
        vx2 = vw - hx_margin

        if vy2 <= vy1 or vx2 <= vx1:
            return None

        plate_roi = veh_roi[vy1:vy2, vx1:vx2]
        return plate_roi

    # ------------------------------------------------------------------
    # OCR + post-processing
    # ------------------------------------------------------------------
    @staticmethod
    def _preprocess_for_ocr(plate_image: np.ndarray) -> np.ndarray:
        """
        Enhanced preprocessing to improve OCR accuracy:
        - Convert to grayscale
        - Noise reduction (bilateral filter + median blur)
        - Contrast enhancement (CLAHE)
        - Adaptive thresholding for better text extraction
        """
        # Convert to grayscale
        if len(plate_image.shape) == 3:
            gray = cv2.cvtColor(plate_image, cv2.COLOR_BGR2GRAY)
        else:
            gray = plate_image.copy()

        # Noise reduction: bilateral filter (preserves edges)
        denoised = cv2.bilateralFilter(gray, d=9, sigmaColor=75, sigmaSpace=75)
        # Additional noise reduction with median blur
        denoised = cv2.medianBlur(denoised, 3)

        # Contrast enhancement using CLAHE (Contrast Limited Adaptive Histogram Equalization)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(denoised)

        # Adaptive thresholding for high contrast
        thr = cv2.adaptiveThreshold(
            enhanced,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            11,  # block size (increased from 31 for better detail)
            2,   # C constant
        )
        return thr

    @staticmethod
    def _clean_plate_text(text: str) -> str:
        """
        Normalize OCR text to a plate-like string:
        - Uppercase
        - Remove spaces and dashes
        - Keep only A–Z and 0–9
        """
        if not text:
            return ""
        text = text.upper()
        text = text.replace(" ", "").replace("-", "")
        text = re.sub(r"[^A-Z0-9]", "", text)
        return text

    def read_plate(self, plate_image: np.ndarray) -> Tuple[str, float]:
        """
        Run OCR on a cropped plate image and return (cleaned_text, confidence).

        :param plate_image: BGR or grayscale image of plate region.
        :return:            (plate_text, best_confidence). If not found, ("", 0.0).
        """
        if plate_image is None:
            return "", 0.0

        # Ensure BGR
        if len(plate_image.shape) == 2:
            plate_bgr = cv2.cvtColor(plate_image, cv2.COLOR_GRAY2BGR)
        else:
            plate_bgr = plate_image

        # EasyOCR works directly on RGB images; start with raw ROI.
        pre_rgb = cv2.cvtColor(plate_bgr, cv2.COLOR_BGR2RGB)

        results = self.reader.readtext(pre_rgb, detail=1)
        if not results:
            return "", 0.0

        best_text = ""
        best_conf = 0.0

        for (_bbox, text, conf) in results:
            cleaned = self._clean_plate_text(text)
            if not cleaned:
                continue
            if conf > best_conf:
                best_conf = float(conf)
                best_text = cleaned

        return best_text, best_conf

    def read_plate_from_vehicle(
        self,
        frame: np.ndarray,
        vehicle_bbox: BBox,
    ) -> Tuple[str, float, Optional[np.ndarray]]:
        """
        Convenience method:
        - Crop plate region from a vehicle bbox
        - Run OCR
        - Return (plate_text, confidence, plate_roi)
        """
        plate_roi = self.crop_plate_from_vehicle(frame, vehicle_bbox)
        if plate_roi is None:
            return "", 0.0, None

        text, conf = self.read_plate(plate_roi)
        return text, conf, plate_roi


