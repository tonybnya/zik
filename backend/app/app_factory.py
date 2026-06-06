"""
Script Name : app_factory.py
Description : Flask application factory. Wires the database, CORS, error
              handlers, and route blueprints. Used by db_init, seed, and
              any WSGI runner (gunicorn, vercel serverless, dev server).

              Run with:
                  uv run flask --app app.app_factory:create_app run
                  uv run flask --app app.app_factory:create_app shell

Author      : @tonybnya
"""

from __future__ import annotations

import logging
import traceback
from typing import Any, Type

from flask import Flask
from flask_cors import CORS

from app.config import Config
from app.errors import register_error_handlers
from app.extensions import db


log = logging.getLogger(__name__)


def create_app(config_class: Type[Config] | Config = Config) -> Flask:
    """Build and configure a Flask app instance.

    Args:
        config_class: either a Config subclass or an instance. Subclass is
            the typical pattern for testing.
    """
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)

    origins = [o.strip() for o in app.config["CORS_ORIGINS"].split(",")]
    CORS(
        app,
        resources={r"/api/*": {"origins": origins}},
        supports_credentials=True,
    )

    from app.auth.middleware import init_auth

    init_auth(app)

    register_error_handlers(app)

    from app.routes.favorites import favorites_bp
    from app.routes.health import health_bp
    from app.routes.history import history_bp
    from app.routes.preferences import preferences_bp
    from app.routes.recommendations import recommendations_bp
    from app.routes.songs import songs_bp

    app.register_blueprint(health_bp)
    app.register_blueprint(songs_bp)
    app.register_blueprint(favorites_bp)
    app.register_blueprint(history_bp)
    app.register_blueprint(preferences_bp)
    app.register_blueprint(recommendations_bp)

    return app


__all__ = ["create_app"]


# Re-export for tooling that walks this module.
_ = Any  # silence unused-import warning for Any
_ = traceback  # silence unused-import warning for traceback
