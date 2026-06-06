"""
Script Name : health.py
Description : Liveness + readiness endpoint. Used by the Vercel/Render
              health check and the frontend to detect a dead backend.
Author      : @tonybnya
"""

from __future__ import annotations

from flask import Blueprint, jsonify

health_bp = Blueprint("health", __name__)


@health_bp.get("/api/health")
def health() -> tuple:
    return jsonify({"status": "ok"}), 200
