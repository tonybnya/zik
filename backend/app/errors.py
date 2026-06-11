"""
Script Name : errors.py
Description : Centralized JSON error handlers. Every HTTP error path
              returns a consistent shape:

                  { "error": "<machine_code>", "message": "<human_text>" }

              Use ApiError to raise domain-specific errors from routes.
Author      : @tonybnya
"""

from __future__ import annotations

import logging
from typing import Any

from flask import Flask, jsonify
from werkzeug.exceptions import HTTPException

log = logging.getLogger(__name__)


class ApiError(Exception):
    """Domain error that maps cleanly to a JSON response."""

    def __init__(self, message: str, status_code: int = 400, code: str | None = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.code = code or _default_code(status_code)


def _default_code(status_code: int) -> str:
    return {
        400: "bad_request",
        401: "unauthorized",
        403: "forbidden",
        404: "not_found",
        405: "method_not_allowed",
        409: "conflict",
        422: "unprocessable",
    }.get(status_code, "error")


def register_error_handlers(app: Flask) -> None:
    @app.errorhandler(ApiError)
    def _handle_api_error(err: ApiError) -> Any:
        return jsonify({"error": err.code, "message": err.message}), err.status_code

    @app.errorhandler(HTTPException)
    def _handle_http_exception(err: HTTPException) -> Any:
        return (
            jsonify(
                {"error": _default_code(err.code or 500), "message": err.description}
            ),
            err.code or 500,
        )

    @app.errorhandler(Exception)
    def _handle_unexpected(err: Exception) -> Any:
        log.exception("Unhandled exception: %s", err)
        return (
            jsonify(
                {
                    "error": "internal_server_error",
                    "message": "An unexpected error occurred.",
                }
            ),
            500,
        )
