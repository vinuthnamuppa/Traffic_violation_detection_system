from __future__ import annotations

"""
Authentication routes (register, login, refresh).

This blueprint is additive and does not affect existing violation APIs.
"""

import os

from flask import Blueprint, jsonify, request

from backend.models.user import create_user, find_user_by_email, verify_user_credentials
from backend.utils.auth import create_access_token, create_refresh_token, _decode_token


auth_bp = Blueprint("auth_bp", __name__, url_prefix="/api/auth")


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip()
    password = data.get("password") or ""
    role = (data.get("role") or "public").strip().lower()

    try:
        if role not in ("public", "officer"):
            role = "public"
        user = create_user(name=name, email=email, password=password, role=role)
    except ValueError as exc:
        return jsonify({"status": "error", "message": str(exc)}), 400
    except Exception as exc:  # pragma: no cover - duplicate email, etc.
        return (
            jsonify(
                {"status": "error", "message": "Registration failed", "detail": str(exc)}
            ),
            400,
        )

    access = create_access_token(user)
    refresh = create_refresh_token(user)
    return (
        jsonify(
            {
                "status": "success",
                "user": user,
                "access_token": access,
                "refresh_token": refresh,
            }
        ),
        201,
    )


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip()
    password = data.get("password") or ""

    user = verify_user_credentials(email=email, password=password)
    if not user:
        return (
            jsonify({"status": "error", "message": "Invalid email or password"}),
            401,
        )

    access = create_access_token(user)
    refresh = create_refresh_token(user)
    return jsonify(
        {
            "status": "success",
            "user": user,
            "access_token": access,
            "refresh_token": refresh,
        }
    )


@auth_bp.route("/refresh", methods=["POST"])
def refresh():
    data = request.get_json(silent=True) or {}
    token = data.get("refresh_token") or ""
    if not token:
        return (
            jsonify({"status": "error", "message": "Missing refresh_token"}),
            400,
        )

    try:
        payload = _decode_token(token, refresh=True)
    except PermissionError as exc:
        return jsonify({"status": "error", "message": str(exc)}), 401

    if payload.get("type") != "refresh":
        return jsonify({"status": "error", "message": "Invalid token type"}), 401

    user = {
        "id": payload.get("sub"),
        "email": payload.get("email"),
        "role": payload.get("role"),
    }
    access = create_access_token(user)
    return jsonify({"status": "success", "access_token": access})


@auth_bp.route("/validate-official-key", methods=["POST"])
def validate_official_key():
    """
    Lightweight helper endpoint to validate an OFFICIAL registration key.

    This keeps the core registration flow unchanged while still allowing
    the frontend to enforce that only users who know the secret can sign
    up as officers.

    Env var:
        OFFICIAL_REGISTRATION_SECRET
            - Default: "OFFICIAL-SECRET-1234"
    """
    data = request.get_json(silent=True) or {}
    provided_key = (data.get("official_key") or "").strip()
    expected_key = os.getenv("OFFICIAL_REGISTRATION_SECRET", "OFFICIAL-SECRET-1234")

    if not provided_key or provided_key != expected_key:
        return (
            jsonify({"status": "error", "message": "Invalid official registration key"}),
            401,
        )

    return jsonify({"status": "success"})

