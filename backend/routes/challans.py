from __future__ import annotations

"""
Challan and payment routes.

These routes sit on top of existing violations and do not change the
`violations` collection or detection pipeline.
"""

from datetime import datetime, timezone
from typing import Any, Dict

from flask import Blueprint, jsonify, g, request

from backend.models.challan import (
    create_challan_from_violation,
    delete_challan,
    get_challan_by_id,
    list_all_challans,
    list_challans_for_user,
    update_challan,
)
from backend.models.officer_log import log_officer_action
from backend.models.payment import create_payment
from backend.models.violation import list_violations
from backend.utils.auth import jwt_required, roles_required


challans_bp = Blueprint("challans_bp", __name__, url_prefix="/api/challans")


@challans_bp.route("", methods=["GET"])
@jwt_required
def get_challans():
    """
    List challans.

    - Public users: only their own challans.
    - Officers: all challans.
    """
    user = g.current_user
    if user["role"] == "officer":
        data = list_all_challans()
    else:
        data = list_challans_for_user(user_id=user["id"])
    return jsonify({"status": "success", "count": len(data), "challans": data})


@challans_bp.route("/from-violation", methods=["POST"])
@jwt_required
def create_from_violation():
    """
    Create a challan from an existing violation ID.
    """
    data = request.get_json(silent=True) or {}
    violation_id = data.get("violation_id")
    fine_amount = data.get("fine_amount")

    if not violation_id:
        return (
            jsonify({"status": "error", "message": "violation_id is required"}),
            400,
        )

    # Reuse list_violations helper with a small limit and filter client-side.
    violations = list_violations(limit=500)
    violation = next(
        (v for v in violations if str(v.get("id")) == str(violation_id)), None
    )
    if not violation:
        return (
            jsonify({"status": "error", "message": "Violation not found"}),
            404,
        )

    challan = create_challan_from_violation(
        violation=violation,
        user_id=g.current_user["id"],
        fine_amount=fine_amount,
    )
    return jsonify({"status": "success", "challan": challan}), 201


@challans_bp.route("/<challan_id>", methods=["PATCH"])
@jwt_required
@roles_required(["officer"])
def update_challan_route(challan_id: str):
    """
    Officers can edit challan details (fine, status, meta).
    """
    data: Dict[str, Any] = request.get_json(silent=True) or {}
    allowed_fields = {"fine_amount", "status", "meta", "paid_at", "payment_id"}
    updates = {k: v for k, v in data.items() if k in allowed_fields}

    updated = update_challan(challan_id, updates)
    if not updated:
        return (
            jsonify({"status": "error", "message": "Challan not found"}),
            404,
        )

    log_officer_action(
        officer_id=g.current_user["id"],
        action="update_challan",
        challan_id=challan_id,
        details={"updates": updates},
    )
    return jsonify({"status": "success", "challan": updated})


@challans_bp.route("/<challan_id>", methods=["DELETE"])
@jwt_required
@roles_required(["officer"])
def delete_challan_route(challan_id: str):
    """
    Officers can delete challans.
    """
    ok = delete_challan(challan_id)
    if not ok:
        return (
            jsonify({"status": "error", "message": "Challan not found"}),
            404,
        )

    log_officer_action(
        officer_id=g.current_user["id"],
        action="delete_challan",
        challan_id=challan_id,
    )
    return jsonify({"status": "success"})


@challans_bp.route("/<challan_id>/pay", methods=["POST"])
@jwt_required
def pay_challan(challan_id: str):
    """
    Simulate an online payment for a challan.
    """
    challan = get_challan_by_id(challan_id)
    if not challan:
        return (
            jsonify({"status": "error", "message": "Challan not found"}),
            404,
        )

    if challan.get("status") == "paid":
        return jsonify({"status": "error", "message": "Challan already paid"}), 400

    user = g.current_user
    amount = float(challan.get("fine_amount", 0.0))

    # In real life, integrate Razorpay/UPI here. For now, mark as success.
    payment = create_payment(
        challan_id=challan_id,
        amount=amount,
        user_id=user["id"],
        status="success",
        method="online",
        transaction_ref=f"SIM-{datetime.now(timezone.utc).timestamp()}",
    )

    updated = update_challan(
        challan_id,
        {
            "status": "paid",
            "paid_at": datetime.now(timezone.utc),
            "payment_id": payment["id"],
        },
    )

    return jsonify(
        {
            "status": "success",
            "challan": updated,
            "payment": payment,
        }
    )


