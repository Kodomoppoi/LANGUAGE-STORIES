from ..services.srs_engine import (
    get_status_info,
    calculate_sm2,
    record_word_click,
)


def test_status_info_orange():
    color, label, weight, stage = get_status_info(0.20, is_pinned=False)
    assert color == "orange"
    assert "CRÍTICO" in label
    assert weight == 4


def test_status_info_yellow():
    color, label, weight, stage = get_status_info(0.55, is_pinned=False)
    assert color == "yellow"
    assert "APRENDENDO" in label
    assert weight == 2


def test_status_info_green():
    color, label, weight, stage = get_status_info(0.85, is_pinned=False)
    assert color == "green"
    assert "DOMINADO" in label
    assert weight == 1


def test_status_info_pinned_overrides_weight():
    color, label, weight, stage = get_status_info(0.95, is_pinned=True)
    assert color == "green"
    assert weight == 4  # Pinned items always retain maximum priority


def test_sm2_success_progression():
    # Primeira revisão com nota 4
    rep, ivl, ef, score = calculate_sm2(repetition=0, interval=1, ease_factor=2.5, quality=4)
    assert rep == 1
    assert ivl == 1
    assert score > 0.30

    # Segunda revisão bem sucedida
    rep2, ivl2, ef2, score2 = calculate_sm2(repetition=rep, interval=ivl, ease_factor=ef, quality=5)
    assert rep2 == 2
    assert ivl2 == 6
    assert score2 > score


def test_sm2_failure_resets():
    # Falha na retenção (quality = 1)
    rep, ivl, ef, score = calculate_sm2(repetition=3, interval=15, ease_factor=2.4, quality=1)
    assert rep == 0
    assert ivl == 1
    assert score < 0.35


def test_record_word_click():
    res = record_word_click(looked_up_count=2, current_score=0.40, is_pinned=False)
    assert res["looked_up_count"] == 3
    assert res["mastery_score"] < 0.40
    assert res["status_color"] in ["yellow", "orange"]
