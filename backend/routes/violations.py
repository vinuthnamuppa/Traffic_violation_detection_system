"""
Flask routes (Blueprint) for managing traffic violations.

Exposes:
- GET /api/violations       – list violations with optional filters
- POST /api/violations      – create a new violation record
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from flask import Blueprint, jsonify, request

from ..models.violation import Violation, insert_violation, list_violations


violations_bp = Blueprint("violations_bp", __name__, url_prefix="/api/violations")


def _parse_date(date_str: Optional[str]) -> Optional[datetime]:
    """
    Parse a simple YYYY-MM-DD date string into a datetime at 00:00:00.
    """
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        return None


@violations_bp.route("", methods=["GET"])
def get_violations():
    """
    List violations with optional filters.

    Query parameters:
        - vehicle_number: filter by vehicle number (exact, case-insensitive)
        - violation_type: "over_speeding", "signal_jump", etc.
        - from_date:      "YYYY-MM-DD"
        - to_date:        "YYYY-MM-DD" (inclusive)
    """
    vehicle_number = request.args.get("vehicle_number") or None
    violation_type = request.args.get("violation_type") or None
    from_date_str = request.args.get("from_date") or None
    to_date_str = request.args.get("to_date") or None

    from_date = _parse_date(from_date_str)
    to_date = _parse_date(to_date_str)

    # Make 'to_date' inclusive by adding 1 day and using "<=" in the DB helper
    if to_date is not None:
        to_date = to_date + timedelta(days=1)

    docs = list_violations(
        vehicle_number=vehicle_number,
        violation_type=violation_type,
        from_date=from_date,
        to_date=to_date,
        limit=200,
    )

    # Convert datetime objects to ISO strings for JSON
    for d in docs:
        ts = d.get("timestamp")
        if isinstance(ts, datetime):
            d["timestamp"] = ts.isoformat()

    return jsonify(
        {
            "status": "success",
            "count": len(docs),
            "violations": docs,
        }
    )


@violations_bp.route("", methods=["POST"])
def create_violation():
    """
    Create a new violation record.

    Expected JSON body:
        {
          "vehicle_number": "KA01AB1234",
          "violation_type": "over_speeding",
          "speed_kmph": 78.5,
          "timestamp": "2024-02-03T12:34:56",
          "snapshot_path": "/snapshots/xyz.jpg",
          "extra": {...}          # optional
        }
    If 'timestamp' is omitted, current UTC time is used.
    """
    data: Dict[str, Any] = request.get_json(silent=True) or {}

    vehicle_number = (data.get("vehicle_number") or "").strip()
    violation_type = (data.get("violation_type") or "").strip()
    speed_kmph = float(data.get("speed_kmph") or 0.0)
    snapshot_path = (data.get("snapshot_path") or "").strip()
    extra = data.get("extra") or {}

    if not vehicle_number or not violation_type:
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "vehicle_number and violation_type are required.",
                }
            ),
            400,
        )

    # Parse timestamp if provided, otherwise use now (UTC)
    ts_raw = data.get("timestamp")
    if ts_raw:
        try:
            # Accept ISO strings like "2024-02-03T12:34:56"
            timestamp = datetime.fromisoformat(ts_raw)
        except ValueError:
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "Invalid timestamp format. Use ISO format (YYYY-MM-DDTHH:MM:SS).",
                    }
                ),
                400,
            )
    else:
        timestamp = datetime.utcnow()

    v = Violation(
        vehicle_number=vehicle_number,
        violation_type=violation_type,
        speed_kmph=speed_kmph,
        timestamp=timestamp,
        snapshot_path=snapshot_path,
        extra=extra,
    )

    inserted_id = insert_violation(v)
    return jsonify({"status": "success", "id": inserted_id}), 201


