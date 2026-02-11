from __future__ import annotations

"""
Officer action log model.

Keeps an audit trail of changes made by traffic officers to challans/violations.
"""

import os
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from ..database import get_db


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _get_collection():
    db = get_db()
    coll_name = os.getenv("MONGODB_COLLECTION_OFFICER_LOGS", "officer_logs")
    coll = db[coll_name]
    coll.create_index("officer_id")
    coll.create_index("challan_id")
    coll.create_index("violation_id")
    coll.create_index("created_at")
    return coll


@dataclass
class OfficerLog:
    officer_id: str
    action: str
    challan_id: Optional[str] = None
    violation_id: Optional[str] = None
    details: Dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=_utcnow)

    def to_document(self) -> Dict[str, Any]:
        return asdict(self)


def log_officer_action(
    officer_id: str,
    action: str,
    challan_id: Optional[str] = None,
    violation_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
) -> None:
    coll = _get_collection()
    entry = OfficerLog(
        officer_id=officer_id,
        action=action,
        challan_id=challan_id,
        violation_id=violation_id,
        details=details or {},
    )
    coll.insert_one(entry.to_document())


