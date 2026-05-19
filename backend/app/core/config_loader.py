import json
import os
from functools import lru_cache

CONFIG_DIR = os.path.join(os.path.dirname(__file__), "..", "config")


def _load_json(filename: str) -> dict:
    """Load a JSON config file from the config directory."""
    path = os.path.join(CONFIG_DIR, filename)
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


@lru_cache(maxsize=None)
def get_keywords() -> dict:
    return _load_json("keywords.json")


@lru_cache(maxsize=None)
def get_thresholds() -> dict:
    return _load_json("thresholds.json")


@lru_cache(maxsize=None)
def get_departments() -> dict:
    return _load_json("departments.json")


@lru_cache(maxsize=None)
def get_zones() -> dict:
    """Return a flat {zone_id: entry} dict, unwrapping the 'zones' wrapper key."""
    raw = _load_json("zones.json")
    return raw.get("zones", raw)
