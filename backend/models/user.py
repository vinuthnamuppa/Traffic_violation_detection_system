from __future__ import annotations

"""
User model and MongoDB helpers.

This module is **additive** and does not modify the existing `Violation` model.
It introduces a simple role-based user system:
    - public  (citizen)
    - officer (traffic officer)
"""

import os
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, Optional

import bcrypt
from bson import ObjectId

from ..database import get_db


def _get_collection():
    db = get_db()
    coll_name = os.getenv("MONGODB_COLLECTION_USERS", "users")
    coll = db[coll_name]
    coll.create_index("email", unique=True)
    coll.create_index("role")
    return coll


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


@dataclass
class User:
    """
    Application user.

    Fields:
        name:        Full name.
        email:       Unique email identifier.
        password:    Hashed password (never store plain text).
        role:        "public" or "officer".
        created_at:  Creation timestamp (UTC).
    """

    name: str
    email: str
    password_hash: str
    role: str = "public"
    created_at: datetime = field(default_factory=_utcnow)

    def to_document(self) -> Dict[str, Any]:
        doc = asdict(self)
        return doc


def _hash_password(plain_password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(plain_password.encode("utf-8"), salt).decode("utf-8")


def _check_password(plain_password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            password_hash.encode("utf-8"),
        )
    except ValueError:
        return False


def create_user(
    name: str,
    email: str,
    password: str,
    role: str = "public",
) -> Dict[str, Any]:
    """
    Create a new user with hashed password.
    """
    coll = _get_collection()
    email = (email or "").strip().lower()
    role = role if role in ("public", "officer") else "public"

    if not email or not password:
        raise ValueError("Email and password are required")

    password_hash = _hash_password(password)
    user = User(
        name=name or "",
        email=email,
        password_hash=password_hash,
        role=role,
    )
    doc = user.to_document()
    result = coll.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    doc.pop("password_hash", None)
    return doc


def find_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    coll = _get_collection()
    doc = coll.find_one({"email": (email or "").strip().lower()})
    if not doc:
        return None
    doc["id"] = str(doc.get("_id"))
    return doc


def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    coll = _get_collection()
    try:
        obj_id = ObjectId(user_id)
    except Exception:
        return None
    doc = coll.find_one({"_id": obj_id})
    if not doc:
        return None
    doc["id"] = str(doc.get("_id"))
    return doc


def verify_user_credentials(email: str, password: str) -> Optional[Dict[str, Any]]:
    """
    Return a sanitized user dict if credentials are valid, otherwise None.
    """
    coll = _get_collection()
    email = (email or "").strip().lower()
    doc = coll.find_one({"email": email})
    if not doc:
        return None

    password_hash = doc.get("password_hash") or ""
    if not _check_password(password, password_hash):
        return None

    # Remove sensitive fields
    doc["id"] = str(doc.get("_id"))
    doc.pop("_id", None)
    doc.pop("password_hash", None)
    return doc


