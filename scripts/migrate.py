#!/usr/bin/env python3
"""
NimbusX Database Migration Runner

Applies SQL migration files to Supabase in order.
Requires: python 3.10+, supabase-py (`pip install supabase`)

Usage:
    python scripts/migrate.py --url <SUPABASE_URL> --key <SERVICE_ROLE_KEY>
"""

import argparse
import glob
import os
from supabase import create_client, Client


MIGRATIONS = [
    "supabase-schema.sql",
    "supabase-e2ee-migration.sql",
    "supabase-pulse-migration.sql",
]


def parse_args():
    parser = argparse.ArgumentParser(description="Run NimbusX database migrations")
    parser.add_argument("--url", required=True, help="Supabase project URL")
    parser.add_argument("--key", required=True, help="Supabase service_role key")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print SQL without executing",
    )
    return parser.parse_args()


def run_migration(supabase: Client, path: str, dry_run: bool = False):
    """Read and execute a SQL migration file."""
    if not os.path.exists(path):
        print(f"  ⚠  {path} not found, skipping...")
        return

    with open(path, "r") as f:
        sql = f.read()

    statements = [s.strip() for s in sql.split(";") if s.strip()]

    print(f"\n  📄 {path} ({len(statements)} statements)")

    for i, stmt in enumerate(statements, 1):
        if dry_run:
            print(f"     [{i}] {stmt[:80]}...")
        else:
            try:
                supabase.rpc("exec_sql", {"sql": stmt}).execute()
                print(f"     [{i}] ✅")
            except Exception as e:
                # Some statements (CREATE IF NOT EXISTS) may return errors
                # if objects already exist — these are non-fatal
                error_msg = str(e)
                if "already exists" in error_msg or "duplicate" in error_msg:
                    print(f"     [{i}] ⚠  Already applied")
                else:
                    print(f"     [{i}] ❌ {error_msg[:60]}")


def check_migration_tracking(supabase: Client) -> set:
    """Check which migrations have already been applied."""
    try:
        result = supabase.table("_migrations").select("filename").execute()
        return {row["filename"] for row in result.data}
    except Exception:
        return set()


def record_migration(supabase: Client, filename: str):
    """Record a migration as applied."""
    try:
        supabase.table("_migrations").insert({
            "filename": filename,
            "applied_at": "now()",
        }).execute()
    except Exception:
        pass  # Table might not exist yet


def main():
    args = parse_args()
    supabase: Client = create_client(args.url, args.key)

    print("╔══════════════════════════════════════════╗")
    print("║     NimbusX Database Migration Runner    ║")
    print("╚══════════════════════════════════════════╝")

    applied = check_migration_tracking(supabase) if not args.dry_run else set()
    print(f"\nFound {len(applied)} previously applied migrations")

    for migration in MIGRATIONS:
        if migration in applied:
            print(f"\n  ✅ {migration} already applied, skipping...")
            continue

        run_migration(supabase, migration, args.dry_run)

        if not args.dry_run:
            record_migration(supabase, migration)

    print("\n✅ Migration run complete!")


if __name__ == "__main__":
    main()
