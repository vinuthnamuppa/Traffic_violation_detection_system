"""
Violation model and MongoDB helpers.

This module defines:
- A `Violation` dataclass representing one traffic violation record.
- Helper functions to insert and query violations from MongoDB.

MongoDB collection name is taken from the `MONGODB_COLLECTION_VIOLATIONS`
environment variable (defaults to `violations`).
"""

from __future__ import annotations

import os
from dataclasses import asdict, dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional

from bson import ObjectId

from ..database import get_db


def _get_collection():
    db = get_db()
    coll_name = os.getenv("MONGODB_COLLECTION_VIOLATIONS", "violations")
    coll = db[coll_name]
    # Optionally ensure an index on timestamp for faster queries by date.
    coll.create_index("timestamp")
    coll.create_index("vehicle_number")
    coll.create_index("violation_type")
    return coll


@dataclass
class Violation:
    """
    In-memory representation of a traffic violation.

    Fields:
        vehicle_number: Cleaned plate text from OCR (e.g. "KA01AB1234").
        violation_type: "over_speeding" or "signal_jump" (or both, if you decide).
        speed_kmph:     Estimated speed at time of violation (float, may be 0.0).
        timestamp:      Python datetime in UTC.
        snapshot_path:  Relative path to the stored snapshot image.
        extra:          Optional dict for any extra metadata (location, camera_id, etc.).
    """

    vehicle_number: str
    violation_type: str
    speed_kmph: float
    timestamp: datetime
    snapshot_path: str
    extra: Dict[str, Any] = field(default_factory=dict)

    def to_document(self) -> Dict[str, Any]:
        """
        Convert to a MongoDB document (dict). The `_id` is added upon insert.
        """
        doc = asdict(self)
        # Ensure datetime is timezone-naive UTC or aware; here we store as naive UTC.
        return doc

    @staticmethod
    def from_document(doc: Dict[str, Any]) -> "Violation":
        """
        Re-create a Violation from a MongoDB document.
        The MongoDB `_id` is ignored here; you can attach it separately if needed.
        """
        return Violation(
            vehicle_number=doc.get("vehicle_number", ""),
            violation_type=doc.get("violation_type", ""),
            speed_kmph=float(doc.get("speed_kmph", 0.0)),
            timestamp=doc.get("timestamp", datetime.utcnow()),
            snapshot_path=doc.get("snapshot_path", ""),
            extra=doc.get("extra", {}) or {},
        )


def insert_violation(violation: Violation) -> str:
    """
    Insert a Violation into MongoDB and return the inserted document ID as a string.
    """
    coll = _get_collection()
    doc = violation.to_document()
    result = coll.insert_one(doc)
    return str(result.inserted_id)


def list_violations(
    vehicle_number: Optional[str] = None,
    violation_type: Optional[str] = None,
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
    limit: int = 100,
) -> List[Dict[str, Any]]:
    """
    Query violations with optional filters. Returns plain dicts suitable for JSON.

    :param vehicle_number: Filter by exact vehicle number (case-insensitive).
    :param violation_type: Filter by violation type string.
    :param from_date:      Only records with timestamp >= from_date.
    :param to_date:        Only records with timestamp <= to_date.
    :param limit:          Max number of records to return.
    """
    coll = _get_collection()

    query: Dict[str, Any] = {}

    if vehicle_number:
        # Case-insensitive exact match using regex
        query["vehicle_number"] = {
            "$regex": f"^{vehicle_number}$",
            "$options": "i",
        }

    if violation_type:
        query["violation_type"] = violation_type

    if from_date or to_date:
        time_filter: Dict[str, Any] = {}
        if from_date:
            time_filter["$gte"] = from_date
        if to_date:
            time_filter["$lte"] = to_date
        query["timestamp"] = time_filter

    cursor = (
        coll.find(query)
        .sort("timestamp", -1)  # newest first
        .limit(limit)
    )

    results: List[Dict[str, Any]] = []
    for doc in cursor:
        # Convert ObjectId to string for JSON-serializable output
        doc["id"] = str(doc.get("_id", ""))
        doc.pop("_id", None)
        results.append(doc)

    return results


