"""
Team recommendation engine.

Strategies
----------
balanced   – Mix of alignments (good / bad / neutral), maximising total powerstats.
power      – Top heroes ranked by a specific stat or composite score.
random     – Randomly selected heroes (good for fun / replayability).

Comparison
----------
compare    – Given two or more teams, predict a winner and explain the reasoning.
"""

import random
import logging
from .models import Superhero

logger = logging.getLogger('api')

STAT_FIELDS = ["intelligence", "strength", "speed", "durability", "power", "combat"]

# Alignment mix target for balanced teams
BALANCED_MIX = {"good": 0.5, "bad": 0.25, "neutral": 0.15, "unknown": 0.10}


def _get_total_power(hero: Superhero) -> int:
    tp = hero.total_power
    return tp() if callable(tp) else tp


def _to_dict(hero: Superhero) -> dict:
    return {
        "id": hero.id,
        "name": hero.name,
        "slug": hero.slug,
        "alignment": hero.alignment,
        "publisher": hero.publisher,
        "image_url": hero.image_url,
        "intelligence": hero.intelligence,
        "strength": hero.strength,
        "speed": hero.speed,
        "durability": hero.durability,
        "power": hero.power,
        "combat": hero.combat,
        "total_power": _get_total_power(hero),
    }


def recommend_balanced(size: int = 6) -> dict:
    """
    Build a balanced team: roughly 50 % heroes, 25 % villains, 15 % neutrals,
    10 % unknowns, all ranked by total_power within their alignment group so we
    pick elite members from each side.
    """
    logger.info(f"Generating balanced team recommendation of size {size}.")

    heroes_by_alignment: dict[str, list[Superhero]] = {a: [] for a in BALANCED_MIX}
    all_heroes = list(Superhero.objects.all())
    for h in all_heroes:
        bucket = h.alignment if h.alignment in heroes_by_alignment else "unknown"
        heroes_by_alignment[bucket].append(h)

    for bucket in heroes_by_alignment:
        heroes_by_alignment[bucket].sort(key=_get_total_power, reverse=True)

    team: list[Superhero] = []
    quotas = {a: max(1, round(BALANCED_MIX[a] * size)) for a in BALANCED_MIX}

    # Fill quotas
    for alignment, quota in quotas.items():
        pool = heroes_by_alignment[alignment]
        # Take top 3x quota to allow for variety, then sample
        candidates = pool[:quota * 3]
        if len(candidates) < quota:
            selected = candidates
        else:
            selected = random.sample(candidates, quota)
        team.extend(selected)

    # Pad / trim to exact size
    remaining = [h for h in all_heroes if h not in team]
    remaining.sort(key=_get_total_power, reverse=True)
    while len(team) < size and remaining:
        team.append(remaining.pop(0))
    team = team[:size]

    return {
        "strategy": "balanced",
        "description": (
            "A balanced team drawn from heroes, villains, and neutral characters. "
            "Each member is an elite performer within their alignment — combining "
            "diverse motivations with high individual power scores."
        ),
        "members": [_to_dict(h) for h in team],
        "total_power": sum(_get_total_power(h) for h in team),
        "stats_summary": _stats_summary(team),
    }


def recommend_by_stat(stat: str, size: int = 6) -> dict:
    """Pick the top `size` heroes ranked by a specific stat."""

    logger.info(f"Generating power team recommendation based on stat '{stat}' of size {size}.")
    if stat not in STAT_FIELDS:
        logger.error(f"Invalid stat '{stat}' requested.")
        raise ValueError(f"Invalid stat '{stat}'. Choose from: {STAT_FIELDS}")

    # Fetch top 3x size to allow variety on refresh
    limit = size * 3
    candidates = list(
        Superhero.objects.all().order_by(f"-{stat}")[:limit]
    )

    heroes = random.sample(candidates, min(len(candidates), size))

    stat_label = stat.capitalize()
    return {
        "strategy": "power",
        "stat": stat,
        "description": (
            f"The ultimate {stat_label} squad — the {size} individuals with the "
            f"highest {stat_label} ratings in the known universe. Specialised, "
            f"formidable, and focused."
        ),
        "members": [_to_dict(h) for h in heroes],
        "total_power": sum(_get_total_power(h) for h in heroes),
        "stats_summary": _stats_summary(heroes),
    }


def recommend_random(size: int = 6) -> dict:
    """Randomly assemble a team — the wildcard option."""

    logger.info(f"Generating random team recommendation of size {size}.")
    all_ids = list(Superhero.objects.values_list("id", flat=True))
    if len(all_ids) < size:
        sample_ids = all_ids
    else:
        sample_ids = random.sample(all_ids, size)

    heroes = list(Superhero.objects.filter(id__in=sample_ids))

    return {
        "strategy": "random",
        "description": (
            "A chaotic wildcard team assembled by pure chance. Expect the unexpected — "
            "this squad might surprise everyone, including themselves."
        ),
        "members": [_to_dict(h) for h in heroes],
        "total_power": sum(_get_total_power(h) for h in heroes),
        "stats_summary": _stats_summary(heroes),
    }


def _stats_summary(heroes: list[Superhero]) -> dict:
    if not heroes:
        return {}
    return {
        stat: round(sum(getattr(h, stat) for h in heroes) / len(heroes), 1)
        for stat in STAT_FIELDS
    }


# ---------------------------------------------------------------------------
# Team Comparison
# ---------------------------------------------------------------------------

STAT_WEIGHTS = {
    "strength": 1.3,
    "power": 1.2,
    "intelligence": 1.1,
    "combat": 1.0,
    "speed": 0.9,
    "durability": 1.0,
}

ALIGNMENT_SYNERGY = {
    # A fully-good or fully-bad team gets a small bonus (tight camaraderie)
    "all_good": 1.05,
    "all_bad": 1.03,
    "mixed": 1.0,
}


def score_team(hero_dicts: list[dict]) -> float:
    """Compute a composite score for a list of hero dictionaries."""
    if not hero_dicts:
        return 0.0

    raw_score = sum(
        sum(h.get(stat, 0) * weight for stat, weight in STAT_WEIGHTS.items())
        for h in hero_dicts
    )

    alignments = {h.get("alignment") for h in hero_dicts}
    if alignments == {"good"}:
        raw_score *= ALIGNMENT_SYNERGY["all_good"]
    elif alignments == {"bad"}:
        raw_score *= ALIGNMENT_SYNERGY["all_bad"]

    return round(raw_score, 2)


def _dominant_stat(hero_dicts: list[dict]) -> tuple[str, float]:
    totals = {stat: sum(h.get(stat, 0) for h in hero_dicts) for stat in STAT_FIELDS}
    best = max(totals, key=totals.get)
    return best, totals[best]


def _star_player(hero_dicts: list[dict]) -> dict | None:
    if not hero_dicts:
        return None
    return max(hero_dicts, key=lambda h: sum(h.get(s, 0) for s in STAT_FIELDS))


def compare_teams(teams: list[dict]) -> dict:
    """
    Accept a list of team objects, each with {"name": str, "members": [hero_dict, ...]}.
    Return a comparison with scores, winner, and a narrative explanation.
    """
    
    logger.info(f"Comparing {len(teams)} teams.")
    if len(teams) < 2:
        logger.error("Attempted to compare less than 2 teams.")
        raise ValueError("At least two teams are required for comparison.")

    scored = []
    for team in teams:
        members = team.get("members", [])
        s = score_team(members)
        dom_stat, dom_val = _dominant_stat(members)
        star = _star_player(members)
    
        team_total_power = sum(h.get("total_power", 0) for h in members)

        scored.append({
            "name": team.get("name", "Unnamed Team"),
            "members": members,
            # Raw stat sum
            "total_power": team_total_power,

            # Weighted prediction score
            "battle_score": s,

            "dominant_stat": dom_stat,
            "dominant_stat_total": dom_val,
            "star_player": star,

            "avg_power": round(team_total_power / max(len(members), 1), 1),
        })

    scored.sort(key=lambda t: t["battle_score"], reverse=True)
    winner = scored[0]
    runner_up = scored[1] if len(scored) > 1 else None

    # Build narrative
    margin = (
        round((winner["battle_score"] - runner_up["battle_score"]) / max(runner_up["battle_score"], 1) * 100, 1)
        if runner_up
        else 0
    )
    star_name = winner["star_player"]["name"] if winner["star_player"] else "Unknown"

    narrative_parts = [
        f"**{winner['name']}** emerges victorious with a battle score of {winner['battle_score']:.0f}.",
        f"Their dominant attribute is **{winner['dominant_stat'].capitalize()}** "
        f"(combined {winner['dominant_stat_total']:.0f}), giving them a decisive edge.",
        f"Star performer **{star_name}** stands out as the most powerful individual on the field.",
    ]

    if runner_up:
        if margin < 5:
            narrative_parts.append(
                f"This was an extremely close contest — {runner_up['name']} trailed by only {margin}%. "
                "A single substitution could flip the outcome."
            )
        elif margin < 20:
            narrative_parts.append(
                f"{runner_up['name']} put up a solid fight, closing within {margin}%, "
                "but couldn't match the winner's composite firepower."
            )
        else:
            narrative_parts.append(
                f"{runner_up['name']} was outclassed — trailing by {margin}%. "
                "A significant restructuring would be needed to be competitive."
            )

    # Alignment commentary
    winner_alignments = {h.get("alignment") for h in winner["members"]}
    if winner_alignments == {"good"}:
        narrative_parts.append("United under a common moral code, this team's coordination is unmatched.")
    elif winner_alignments == {"bad"}:
        narrative_parts.append("Ruthless and unrestrained — morality never slowed them down.")
    elif len(winner_alignments) > 1:
        narrative_parts.append(
            "The diversity of alignments within the team creates an unpredictable dynamic "
            "that opponents struggle to plan against."
        )

    if runner_up and winner["battle_score"] == runner_up["battle_score"]:
        return {
            "winner": "Draw",
            "narrative": "Both teams are perfectly matched. No clear winner.",
            "teams": scored,
        }

    return {
        "winner": winner["name"],
        "narrative": " ".join(narrative_parts),
        "teams": scored,
    }
