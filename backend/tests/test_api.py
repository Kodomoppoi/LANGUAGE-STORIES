from fastapi.testclient import TestClient
from ..main import app
from ..database import init_db


init_db()
client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "language-stories-backend"


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert "docs" in response.json()


def test_vocabulary_lookup_and_click():
    # 1. Lookup de uma nova palavra em Mandarim
    lookup_res = client.post(
        "/api/vocabulary/lookup",
        json={
            "word": "你好",
            "sentence_context": "你好，很高兴认识你！",
            "language": "zh",
            "native_lang": "Portuguese",
        },
    )
    assert lookup_res.status_code == 200
    item = lookup_res.json()
    assert item["word"] == "你好"
    assert "mastery_score" in item
    assert "status_color" in item

    # 2. Registrar clique (assistência contextual)
    click_res = client.post(
        "/api/vocabulary/record-click",
        json={"word": "你好", "language": "zh"},
    )
    assert click_res.status_code == 200
    updated_item = click_res.json()
    assert updated_item["looked_up_count"] >= 1

    # 3. Fixar palavra (⭐)
    pin_res = client.post(
        "/api/vocabulary/toggle-pin",
        json={"word": "你好", "language": "zh", "is_pinned": True},
    )
    assert pin_res.status_code == 200
    pinned_item = pin_res.json()
    assert pinned_item["is_pinned"] is True
    assert pinned_item["repetition_weight"] == 4

    # 4. Revisão SRS SM-2
    review_res = client.post(
        "/api/vocabulary/srs-review",
        json={"word": "你好", "language": "zh", "quality": 4},
    )
    assert review_res.status_code == 200
    reviewed_item = review_res.json()
    assert reviewed_item["srs_repetition"] >= 1


def test_story_generate():
    res = client.post(
        "/api/stories/generate",
        json={
            "language": "zh",
            "proficiency": "A2",
            "theme": "Café e Livros",
            "target_vocab_count": 5,
            "story_length": "standard",
            "repetition_density": "high",
            "native_lang": "Portuguese",
            "gemini_api_key": "test_key_placeholder",
            "gemini_model": "gemini-3.6-flash",
        },
    )
    assert res.status_code == 200
    story = res.json()
    assert "sentences" in story
    assert len(story["sentences"]) > 0
    assert "target_text" in story["sentences"][0]
    assert "translation_text" in story["sentences"][0]
    assert "story_dictionary" in story
    assert "paragraphs" in story


def test_settings_endpoints():
    # 1. Get settings
    get_res = client.get("/api/settings")
    assert get_res.status_code == 200
    data = get_res.json()
    assert "gemini_configured" in data
    assert "gemini_model" in data

    # 2. Update Gemini settings
    post_res = client.post(
        "/api/settings/gemini",
        json={"gemini_api_key": "AIzaSyFakeKeyForTesting123456", "gemini_model": "gemini-3.6-flash"},
    )
    assert post_res.status_code == 200
    post_data = post_res.json()
    assert post_data["gemini_configured"] is True

    # 3. Test Gemini key (fake key should return success=False gracefully without 500 error)
    test_res = client.post(
        "/api/settings/gemini/test",
        json={"gemini_api_key": "AIzaSyFakeKeyForTesting123456"},
    )
    assert test_res.status_code == 200
    test_data = test_res.json()
    assert "success" in test_data
    assert "message" in test_data
