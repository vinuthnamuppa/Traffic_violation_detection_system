from __future__ import annotations

"""
Challan model and helpers.

This module is **additive** and keeps the existing `Violation` collection intact.
Challans reference violations by ID and vehicle number.
"""

import os
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from bson import ObjectId

from ..database import get_db


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _get_collection():
    db = get_db()
    coll_name = os.getenv("MONGODB_COLLECTION_CHALLANS", "challans")
    coll = db[coll_name]
    coll.create_index("vehicle_number")
    coll.create_index("violation_id")
    coll.create_index("user_id")
    coll.create_index("status")
    return coll


@dataclass
class Challan:
    """
    e-Challan record linked to a violation.
    """

    violation_id: str
    vehicle_number: str
    violation_type: str
    fine_amount: float
    status: str = "unpaid"  # unpaid | paid
    user_id: Optional[str] = None
    created_at: datetime = field(default_factory=_utcnow)
    paid_at: Optional[datetime] = None
    payment_id: Optional[str] = None
    meta: Dict[str, Any] = field(default_factory=dict)

    def to_document(self) -> Dict[str, Any]:
        return asdict(self)


def _base_fine_rules() -> Dict[str, Dict[str, Any]]:
    """
    Default fine rules (can be overridden via configuration later).
    """
    return {
        "no_helmet": {"min": 1000, "max": 1000},
        "over_speeding": {"min": 1000, "max": 2000},
        "signal_jump": {"min": 1000, "max": 1000},
        "triple_riding": {"min": 1000, "max": 1000},
    }


def get_fine_for_violation(violation_type: str) -> float:
    """
    Compute a default fine amount for a given violation type.
    Currently returns the 'min' of the configured range.
    """
    rules = _base_fine_rules()
    rule = rules.get(violation_type)
    if not rule:
        return 1000.0
    return float(rule.get("min", 1000))


def create_challan_from_violation(
    violation: Dict[str, Any],
    user_id: Optional[str] = None,
    fine_amount: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Create a challan document from a violation document.
    """
    coll = _get_collection()
    violation_id = str(violation.get("id") or violation.get("_id"))
    vehicle_number = violation.get("vehicle_number", "")
    violation_type = violation.get("violation_type", "")

    if fine_amount is None:
        fine_amount = get_fine_for_violation(violation_type or "over_speeding")

    challan = Challan(
        violation_id=violation_id,
        vehicle_number=vehicle_number,
        violation_type=violation_type,
        fine_amount=fine_amount,
        user_id=user_id,
        meta={
            "snapshot_path": violation.get("snapshot_path"),
            "timestamp": violation.get("timestamp"),
        },
    )
    doc = challan.to_document()
    result = coll.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return doc


def list_challans_for_user(user_id: str) -> List[Dict[str, Any]]:
    coll = _get_collection()
    cursor = coll.find({"user_id": user_id}).sort("created_at", -1)
    results: List[Dict[str, Any]] = []
    for doc in cursor:
        doc["id"] = str(doc.get("_id"))
        doc.pop("_id", None)
        results.append(doc)
    return results


def list_all_challans(limit: int = 200) -> List[Dict[str, Any]]:
    coll = _get_collection()
    cursor = coll.find({}).sort("created_at", -1).limit(limit)
    results: List[Dict[str, Any]] = []
    for doc in cursor:
        doc["id"] = str(doc.get("_id"))
        doc.pop("_id", None)
        results.append(doc)
    return results


def get_challan_by_id(challan_id: str) -> Optional[Dict[str, Any]]:
    coll = _get_collection()
    try:
        obj_id = ObjectId(challan_id)
    except Exception:
        return None
    doc = coll.find_one({"_id": obj_id})
    if not doc:
        return None
    doc["id"] = str(doc.get("_id"))
    doc.pop("_id", None)
    return doc


def update_challan(challan_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    coll = _get_collection()
    try:
        obj_id = ObjectId(challan_id)
    except Exception:
        return None

    updates = {k: v for k, v in updates.items() if k not in {"_id", "id"}}
    result = coll.find_one_and_update(
        {"_id": obj_id},
        {"$set": updates},
        return_document=True,
    )
    if not result:
        return None
    result["id"] = str(result.get("_id"))
    result.pop("_id", None)
    return result


def delete_challan(challan_id: str) -> bool:
    coll = _get_collection()
    try:
        obj_id = ObjectId(challan_id)
    except Exception:
        return False
    res = coll.delete_one({"_id": obj_id})
    return res.deleted_count == 1


