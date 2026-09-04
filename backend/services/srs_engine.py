from datetime import datetime, timedelta
from typing import Dict, Any, Tuple


def get_status_info(mastery_score: float, is_pinned: bool = False) -> Tuple[str, str, int, str]:
    """
    Retorna (status_color, status_label, repetition_weight, srs_stage).
    """
    score = max(0.0, min(1.0, mastery_score))

    if score < 0.35:
        color = "orange"
        label = "CRÍTICO (3-4X)"
        stage = "new" if score < 0.15 else "learning"
        weight = 4
    elif score <= 0.70:
        color = "yellow"
        label = "APRENDENDO (2X)"
        stage = "learning" if score <= 0.50 else "review"
        weight = 2
    else:
        color = "green"
        label = "DOMINADO (1X)"
        stage = "mastered"
        weight = 1

    if is_pinned:
        weight = 4

    return color, label, weight, stage


def calculate_sm2(
    repetition: int,
    interval: int,
    ease_factor: float,
    quality: int,
) -> Tuple[int, int, float, float]:
    """
    Algoritmo SuperMemo-2 clássico com pontuação contínua (0.0 a 1.0).
    quality: 0 (blackout total) a 5 (retenção perfeita).
    Retorna (new_repetition, new_interval, new_ease_factor, new_mastery_score).
    """
    q = max(0, min(5, quality))
    ef = max(1.3, ease_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)))

    if q < 3:
        rep = 0
        ivl = 1
        score_penalty = 0.20 if q == 2 else 0.35
        base_score = max(0.05, (repetition * 0.1) - score_penalty)
    else:
        if repetition == 0:
            ivl = 1
        elif repetition == 1:
            ivl = 6
        else:
            ivl = max(1, round(interval * ef))
        rep = repetition + 1
        base_score = min(1.0, 0.30 + (rep * 0.14) + (q - 3) * 0.08)

    return rep, ivl, round(ef, 3), round(base_score, 3)


def record_word_click(looked_up_count: int, current_score: float, is_pinned: bool = False) -> Dict[str, Any]:
    """
    Ajusta a retenção de forma suave e silenciosa quando o usuário consulta uma palavra no leitor.
    """
    new_count = looked_up_count + 1
    # Penaliza levemente a retenção por necessitar de assistência contextual
    new_score = max(0.05, round(current_score - 0.06, 3))
    color, label, weight, stage = get_status_info(new_score, is_pinned)

    return {
        "looked_up_count": new_count,
        "mastery_score": new_score,
        "status_color": color,
        "status_label": label,
        "repetition_weight": weight,
        "srs_stage": stage,
    }


def compute_next_review_date(interval_days: int) -> datetime:
    return datetime.utcnow() + timedelta(days=interval_days)
