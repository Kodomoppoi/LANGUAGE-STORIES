from ..languages.registry import registry
from ..languages.chinese import ChineseProfile
from ..languages.generic import GenericLanguageProfile


def test_registry_resolves_chinese():
    profile = registry.get("zh")
    assert isinstance(profile, ChineseProfile)
    assert profile.code == "zh"
    assert "zh-CN" in profile.default_tts_voice


def test_registry_resolves_generic():
    ja_profile = registry.get("ja")
    assert isinstance(ja_profile, GenericLanguageProfile)
    assert ja_profile.code == "ja"
    assert "ja-JP" in ja_profile.default_tts_voice

    es_profile = registry.get("es")
    assert es_profile.code == "es"
    assert "es-ES" in es_profile.default_tts_voice


def test_chinese_traits_extraction():
    profile = registry.get("zh")
    item = {
        "word": "宇航员",
        "pinyin": "yǔ háng yuán",
        "radicals": "宀, 舟, 口",
        "hsk_level": 4,
        "context_meaning": "astronauta",
    }
    traits = profile.extract_traits(item)
    assert traits["hanzi"] == "宇航员"
    assert traits["pinyin"] == "yǔ háng yuán"
    assert traits["hsk_level"] == 4
    assert "宀" in traits["radicals"]


def test_chinese_sample_data():
    profile = registry.get("zh")
    sample = profile.get_sample_data(proficiency="A2", theme="Espaço")
    assert "sentences" in sample
    assert len(sample["sentences"]) > 0
    first = sample["sentences"][0]
    assert "target_text" in first
    assert "translation_text" in first
    assert "story_dictionary" in sample
    assert "story_translated_dictionary" in sample


def test_chinese_sample_data_english():
    profile = registry.get("zh")
    sample = profile.get_sample_data(proficiency="A2", theme="Espaço", native_lang="English")
    assert sample["title_translation"] == "Warm Sunlight in the Teahouse After the Rain"
    assert "teahouse" in sample["sentences"][0]["translation_text"]
