from __future__ import annotations

"""
Payment model and helpers.

Simple simulation of online payments for challans.
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
    coll_name = os.getenv("MONGODB_COLLECTION_PAYMENTS", "payments")
    coll = db[coll_name]
    coll.create_index("challan_id")
    coll.create_index("user_id")
    coll.create_index("status")
    return coll


@dataclass
class Payment:
    challan_id: str
    amount: float
    status: str = "success"  # success | failed | pending
    user_id: Optional[str] = None
    method: str = "online"
    created_at: datetime = field(default_factory=_utcnow)
    transaction_ref: Optional[str] = None
    meta: Dict[str, Any] = field(default_factory=dict)

    def to_document(self) -> Dict[str, Any]:
        return asdict(self)


def create_payment(
    challan_id: str,
    amount: float,
    user_id: Optional[str],
    status: str = "success",
    method: str = "online",
    transaction_ref: Optional[str] = None,
    meta: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    coll = _get_collection()
    payment = Payment(
        challan_id=challan_id,
        amount=amount,
        status=status,
        user_id=user_id,
        method=method,
        transaction_ref=transaction_ref,
        meta=meta or {},
    )
    doc = payment.to_document()
    result = coll.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return doc


def list_payments_for_user(user_id: str) -> List[Dict[str, Any]]:
    coll = _get_collection()
    cursor = coll.find({"user_id": user_id}).sort("created_at", -1)
    results: List[Dict[str, Any]] = []
    for doc in cursor:
        doc["id"] = str(doc.get("_id"))
        doc.pop("_id", None)
        results.append(doc)
    return results


def get_payment_by_id(payment_id: str) -> Optional[Dict[str, Any]]:
    coll = _get_collection()
    try:
        obj_id = ObjectId(payment_id)
    except Exception:
        return None
    doc = coll.find_one({"_id": obj_id})
    if not doc:
        return None
    doc["id"] = str(doc.get("_id"))
    doc.pop("_id", None)
    return doc


