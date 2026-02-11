from __future__ import annotations

"""
Auth utilities: JWT creation/verification and role-based decorators.

This module is **additive** and does not alter existing routes or models.
New routes can opt-in to JWT protection using the provided decorators.
"""

import os
from datetime import datetime, timedelta, timezone
from functools import wraps
from typing import Any, Dict, Iterable, Optional

import jwt
from flask import Request, current_app, g, jsonify, request


def _get_env(name: str, default: str) -> str:
    return os.getenv(name, default)


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def create_access_token(user: Dict[str, Any]) -> str:
    """
    Create a short-lived access token.

    Payload keeps only non-sensitive fields: id, email, role.
    """
    secret = _get_env("JWT_SECRET", "dev-secret-change-me")
    minutes = int(_get_env("JWT_ACCESS_EXPIRES_MIN", "15"))
    exp = _now_utc() + timedelta(minutes=minutes)

    payload = {
        "sub": str(user["id"]),
        "email": user.get("email", ""),
        "role": user.get("role", "public"),
        "type": "access",
        "exp": exp,
        "iat": _now_utc(),
    }
    return jwt.encode(payload, secret, algorithm="HS256")


def create_refresh_token(user: Dict[str, Any]) -> str:
    """
    Create a longer-lived refresh token.
    """
    secret = _get_env("JWT_REFRESH_SECRET", "dev-refresh-secret-change-me")
    days = int(_get_env("JWT_REFRESH_EXPIRES_DAYS", "7"))
    exp = _now_utc() + timedelta(days=days)

    payload = {
        "sub": str(user["id"]),
        "email": user.get("email", ""),
        "role": user.get("role", "public"),
        "type": "refresh",
        "exp": exp,
        "iat": _now_utc(),
    }
    return jwt.encode(payload, secret, algorithm="HS256")


def _decode_token(token: str, refresh: bool = False) -> Dict[str, Any]:
    secret = (
        _get_env("JWT_REFRESH_SECRET", "dev-refresh-secret-change-me")
        if refresh
        else _get_env("JWT_SECRET", "dev-secret-change-me")
    )
    try:
        return jwt.decode(token, secret, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise PermissionError("Token expired")
    except jwt.InvalidTokenError:
        raise PermissionError("Invalid token")


def _get_token_from_request(req: Request) -> Optional[str]:
    auth_header = req.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header.split(" ", 1)[1].strip()
    return None


def jwt_required(fn):
    """
    Flask decorator to protect routes with an access token.

    On success, attaches a minimal `current_user` dict to `flask.g`.
    """

    @wraps(fn)
    def wrapper(*args, **kwargs):
        token = _get_token_from_request(request)
        if not token:
            return jsonify({"status": "error", "message": "Missing Authorization header"}), 401

        try:
            payload = _decode_token(token, refresh=False)
        except PermissionError as exc:  # pragma: no cover - simple wrapper
            return jsonify({"status": "error", "message": str(exc)}), 401

        if payload.get("type") != "access":
            return jsonify({"status": "error", "message": "Invalid token type"}), 401

        # Attach minimal user context; full user lookup can be done in route if needed.
        g.current_user = {
            "id": payload.get("sub"),
            "email": payload.get("email"),
            "role": payload.get("role"),
        }
        return fn(*args, **kwargs)

    return wrapper


def roles_required(allowed_roles: Iterable[str]):
    """
    Decorator enforcing that the current user has one of the given roles.

    Usage:
        @jwt_required
        @roles_required(["officer"])
        def some_route(): ...
    """

    allowed = set(allowed_roles)

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            user = getattr(g, "current_user", None)
            if not user or user.get("role") not in allowed:
                return (
                    jsonify(
                        {
                            "status": "error",
                            "message": "Forbidden: insufficient permissions",
                        }
                    ),
                    403,
                )
            return fn(*args, **kwargs)

        return wrapper

    return decorator


