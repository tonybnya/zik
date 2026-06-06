# ZIK — Database Migrations

## Strategy

- **Dev (SQLite):** schema is bootstrapped by `app/db_init.py`, which calls
  `db.create_all()`. This is fine for a single-developer workflow where
  destructive schema changes wipe the local `dev.db` and re-seed.
- **Prod (Supabase Postgres):** schema changes are managed by **Alembic**.

## Why not just `create_all()` in prod?

`create_all()` is order-dependent and **does not migrate existing tables**. It
silently skips anything that already exists, so column renames, type changes,
and new indexes require a drop-and-recreate — which loses data. Alembic
versions every change as a migration script and applies them incrementally.

## Local workflow (dev)

```bash
# First run
uv run python -m app.db_init

# Iterating on models
rm dev.db
uv run python -m app.db_init
uv run python -m app.seed
```

## Production workflow (Phase 14)

1. Add `alembic` and `flask-migrate` to dependencies.
2. `flask db init` (creates `migrations/` directory).
3. Edit a model, then `flask db migrate -m "describe change"`.
4. Review the generated script in `migrations/versions/`.
5. `flask db upgrade` against the Supabase `DATABASE_URL`.

## Postgres-specific notes

- The `JSON` columns (`Song.moods`, `Preference.preferred_genres`,
  `Preference.preferred_moods`) become `JSONB` automatically. Add a GIN index
  in a migration if mood/genre filtering becomes a hot path:

  ```python
  op.create_index(
      "ix_songs_moods_gin",
      "songs",
      ["moods"],
      postgresql_using="gin",
  )
  ```

- `ondelete="CASCADE"` on the FKs (User → PlayHistory / Favorite /
  Preference) is honored by Postgres. SQLite ignores it unless
  `PRAGMA foreign_keys = ON` is set — the test suite enables this implicitly
  via the in-memory engine.

## Connection pooling

`Config.SQLALCHEMY_ENGINE_OPTIONS` sets `pool_pre_ping=True` so dead
connections from serverless deploys are recycled. Tune pool size in
production per the host's recommendations.
