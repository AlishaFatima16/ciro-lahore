"""
Confidence Service — Deterministic, config-driven confidence scoring.

Score breakdown (from thresholds.json):
  base_score      : 25  (always granted when a crisis type is matched)
  keyword_weight  : 25  (awarded when >= min_keyword_matches found)
  telemetry_weight: 50  (split equally across validated telemetry rules)

Final score is clamped to [0, 100]. Workflows with score < halt_threshold
are HALTED by the orchestrator.
"""
from app.core.config_loader import get_thresholds


def calculate_confidence(
    crisis_key: str,
    keyword_match_count: int,
    telemetry_flags: list[bool],
) -> float:
    """
    Calculate a deterministic confidence score.

    Args:
        crisis_key:          One of 'flood', 'smog', 'accident' (or 'unknown').
        keyword_match_count: Number of keyword matches found in complaint text.
        telemetry_flags:     List of booleans — each True means a telemetry rule fired.

    Returns:
        Confidence score as a float in [0.0, 100.0].
    """
    thresholds = get_thresholds()
    conf_cfg = thresholds.get("confidence", {})

    base_score: float = conf_cfg.get("base_score", 25)
    keyword_weight: float = conf_cfg.get("keyword_weight", 25)
    telemetry_weight: float = conf_cfg.get("telemetry_weight", 50)

    if crisis_key == "unknown" or crisis_key not in thresholds:
        return 0.0

    crisis_cfg = thresholds[crisis_key]
    min_kw = crisis_cfg.get("min_keyword_matches", 1)

    score: float = base_score

    # Keyword contribution
    if keyword_match_count >= min_kw:
        score += keyword_weight

    # Telemetry contribution — split evenly across all telemetry flags
    if telemetry_flags:
        per_flag = telemetry_weight / len(telemetry_flags)
        score += per_flag * sum(1 for f in telemetry_flags if f)

    return min(100.0, round(score, 2))


def passes_gate(confidence: float) -> bool:
    """Return True if the confidence score meets or exceeds the halt threshold."""
    thresholds = get_thresholds()
    halt_threshold = thresholds.get("confidence", {}).get("halt_threshold", 70)
    return confidence >= halt_threshold
