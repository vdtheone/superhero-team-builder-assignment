"""
Management command to seed the database with superhero data from the Superhero API.

Usage:
    python manage.py seed_heroes               # fetch IDs 1–100
    python manage.py seed_heroes --start 1 --end 200
    python manage.py seed_heroes --ids 1 2 3   # specific IDs
"""

import time
import requests
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from django.utils.text import slugify
from superheroes.models import Superhero

import os
from dotenv import load_dotenv

load_dotenv()

STATS = ["intelligence", "strength", "speed", "durability", "power", "combat"]


def safe_int(value, default=0):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def safe_float(value, default=None):
    if not value or value in ("null", "-"):
        return default
    # Handle strings like "6'2" / 188 cm" → take last number
    parts = str(value).replace(",", "").split()
    for part in reversed(parts):
        try:
            return float(part)
        except ValueError:
            continue
    return default


def parse_hero(data: dict) -> dict | None:
    """Convert raw API response into Superhero model kwargs."""
    if data.get("response") == "error":
        return None

    stats = data.get("powerstats", {})
    bio = data.get("biography", {})
    appearance = data.get("appearance", {})
    work = data.get("work", {})

    alignment_raw = bio.get("alignment", "").lower()
    alignment = alignment_raw if alignment_raw in ("good", "bad", "neutral") else "unknown"

    heights = appearance.get("height", [])
    weights = appearance.get("weight", [])

    # Prefer metric values (index 1 in the API arrays)
    height_cm = None
    weight_kg = None
    if len(heights) > 1:
        height_cm = safe_float(heights[1])
    if len(weights) > 1:
        weight_kg = safe_float(weights[1])

    aliases_raw = bio.get("aliases", [])
    if isinstance(aliases_raw, str):
        aliases_raw = [aliases_raw]

    name = data.get("name", f"Hero #{data.get('id', '?')}")

    # Build a unique slug
    base_slug = slugify(name)
    slug = base_slug
    n = 1
    while Superhero.objects.filter(slug=slug).exists():
        slug = f"{base_slug}-{n}"
        n += 1

    return dict(
        api_id=int(data["id"]),
        name=name,
        slug=slug,
        intelligence=safe_int(stats.get("intelligence")),
        strength=safe_int(stats.get("strength")),
        speed=safe_int(stats.get("speed")),
        durability=safe_int(stats.get("durability")),
        power=safe_int(stats.get("power")),
        combat=safe_int(stats.get("combat")),
        full_name=bio.get("full-name", ""),
        alter_egos=bio.get("alter-egos", ""),
        aliases=aliases_raw,
        place_of_birth=bio.get("place-of-birth", ""),
        first_appearance=bio.get("first-appearance", ""),
        publisher=bio.get("publisher", ""),
        alignment=alignment,
        gender=appearance.get("gender", ""),
        race=appearance.get("race", ""),
        height_cm=height_cm,
        weight_kg=weight_kg,
        eye_color=appearance.get("eye-color", ""),
        hair_color=appearance.get("hair-color", ""),
        occupation=work.get("occupation", ""),
        base=work.get("base", ""),
        image_url=data.get("image", {}).get("url", ""),
    )


class Command(BaseCommand):
    help = "Seed the database with superhero data from the Superhero API."

    def add_arguments(self, parser):
        parser.add_argument("--start", type=int, default=1, help="Start ID (default 1)")
        parser.add_argument("--end", type=int, default=100, help="End ID inclusive (default 100)")
        parser.add_argument("--ids", nargs="+", type=int, help="Specific hero IDs to fetch")
        parser.add_argument("--delay", type=float, default=0.2, help="Delay between requests (s)")
        parser.add_argument("--update", action="store_true", help="Update existing heroes")

    def handle(self, *args, **options):
        token = os.getenv("SUPERHERO_API_TOKEN")
        if not token:
            raise CommandError(
                "SUPERHERO_API_TOKEN is not set. "
                "Get a free token at https://www.superheroapi.com/ and add it to your .env file."
            )

        ids = options["ids"] or list(range(options["start"], options["end"] + 1))
        self.stdout.write(f"Seeding {len(ids)} heroes (token: {token[:4]}...)...")

        created_count = 0
        updated_count = 0
        skipped_count = 0
        error_count = 0

        for hero_id in ids:
            url = f"https://www.superheroapi.com/api.php/{token}/{hero_id}"
            try:
                resp = requests.get(url, timeout=10)
                resp.raise_for_status()
                data = resp.json()
            except requests.RequestException as exc:
                self.stderr.write(f"  ✗ ID {hero_id}: request error — {exc}")
                error_count += 1
                time.sleep(options["delay"])
                continue

            parsed = parse_hero(data)
            if not parsed:
                self.stdout.write(f"  - ID {hero_id}: no data / error response")
                skipped_count += 1
                time.sleep(options["delay"])
                continue

            existing = Superhero.objects.filter(api_id=hero_id).first()
            if existing:
                if options["update"]:
                    # Preserve manual edits
                    if not existing.is_edited:
                        for key, val in parsed.items():
                            if key != "slug":
                                setattr(existing, key, val)
                        existing.save()
                        updated_count += 1
                        self.stdout.write(f"  ↺ Updated: {existing.name}")
                    else:
                        self.stdout.write(f"  ⚠ Skipped (edited): {existing.name}")
                        skipped_count += 1
                else:
                    skipped_count += 1
            else:
                Superhero.objects.create(**parsed)
                created_count += 1
                self.stdout.write(f"  ✓ Created: {parsed['name']}")

            time.sleep(options["delay"])

        self.stdout.write(
            self.style.SUCCESS(
                f"\nDone! Created: {created_count} | Updated: {updated_count} "
                f"| Skipped: {skipped_count} | Errors: {error_count}"
            )
        )
