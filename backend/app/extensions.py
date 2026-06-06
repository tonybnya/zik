"""
Script Name : extensions.py
Description : Shared SQLAlchemy singleton. Imported by models and the Flask app
              factory (Phase 4) so the same declarative base and metadata are
              reused across the project.
Author      : @tonybnya
"""

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
