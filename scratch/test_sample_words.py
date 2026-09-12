from scratch.test_romaji import to_romaji

def test_samples():
    samples = [
        "東京", "喫茶店", "珈琲", "カフェ", "おはようございます", "美味しい", "注文", "私", "ありがとう"
    ]
    # Simple simulation of dictionary lookup
    d = {
        "東京": "とうきょう", "喫茶店": "きっさてん", "珈琲": "コーヒー", "カフェ": "カフェ",
        "美味しい": "おいしい", "注文": "ちゅうもん", "私": "わたし"
    }
    for s in samples:
        reading = d.get(s, s)
        rom = to_romaji(reading)
        print(f"{s:12} -> {rom}")

test_samples()
