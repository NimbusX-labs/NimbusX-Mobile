#!/usr/bin/env python3
"""
NimbusX Database Seeder

Seeds Supabase with demo data for development and testing.
Requires: python 3.10+, supabase-py (`pip install supabase`)

Usage:
    python scripts/seed.py --url <SUPABASE_URL> --key <SERVICE_ROLE_KEY>

WARNING: This uses the service_role key and bypasses RLS.
Only use in development/staging environments!
"""

import argparse
import json
import uuid
from datetime import datetime, timedelta
from supabase import create_client, Client


def parse_args():
    parser = argparse.ArgumentParser(description="Seed NimbusX with demo data")
    parser.add_argument("--url", required=True, help="Supabase project URL")
    parser.add_argument("--key", required=True, help="Supabase service_role key")
    return parser.parse_args()


def seed_profiles(supabase: Client) -> dict[str, str]:
    """Create demo user profiles and return {email: uid} mapping."""
    users = [
        {"email": "alice@demo.com", "display_name": "Alice"},
        {"email": "bob@demo.com", "display_name": "Bob"},
        {"email": "carol@demo.com", "display_name": "Carol"},
    ]
    uid_map = {}
    for user in users:
        # Auth signup creates profile via trigger
        resp = supabase.auth.admin.create_user({
            "email": user["email"],
            "password": "password123",
            "email_confirm": True,
            "user_metadata": {"displayName": user["display_name"]},
        })
        uid = resp.user.id
        uid_map[user["email"]] = uid
        print(f"  ✅ Created {user['display_name']} ({uid[:8]}...)")
    return uid_map


def seed_contacts(supabase: Client, uid_map: dict[str, str]):
    """Create contact relationships between users."""
    pairs = [
        ("alice@demo.com", "bob@demo.com"),
        ("alice@demo.com", "carol@demo.com"),
        ("bob@demo.com", "carol@demo.com"),
    ]
    for email_a, email_b in pairs:
        supabase.table("contacts").insert({
            "user_id": uid_map[email_a],
            "contact_id": uid_map[email_b],
        }).execute()
        print(f"  ✅ {email_a.split('@')[0]} → {email_b.split('@')[0]}")


def seed_pulses(supabase: Client, uid_map: dict[str, str]):
    """Create demo pulses shared between users."""
    pulses = [
        {
            "uid": uid_map["alice@demo.com"],
            "display_name": "Alice",
            "text": "Just shipped the new E2EE layer! 🔐",
            "shared_with": [uid_map["bob@demo.com"], uid_map["carol@demo.com"]],
        },
        {
            "uid": uid_map["bob@demo.com"],
            "display_name": "Bob",
            "text": "Anyone else loving the new dark theme?",
            "shared_with": [uid_map["alice@demo.com"]],
        },
    ]
    for p in pulses:
        supabase.table("statuses").insert({
            **p,
            "created_at": datetime.utcnow().isoformat(),
            "expires_at": (datetime.utcnow() + timedelta(hours=24)).isoformat(),
        }).execute()
        print(f"  ✅ Pulse from {p['display_name']}")


def main():
    args = parse_args()
    supabase: Client = create_client(args.url, args.key)

    print("╔════════════════════════════════════╗")
    print("║      NimbusX Database Seeder       ║")
    print("╚════════════════════════════════════╝\n")

    print("[1/3] Creating demo users...")
    uid_map = seed_profiles(supabase)

    print("\n[2/3] Creating contact relationships...")
    seed_contacts(supabase, uid_map)

    print("\n[3/3] Seeding demo pulses...")
    seed_pulses(supabase, uid_map)

    print("\n✅ Seeding complete!")
    print("Login credentials: <email> / password123")


if __name__ == "__main__":
    main()
