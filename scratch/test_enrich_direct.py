import sys
from backend.routers.stories import _enrich_story_response

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

mock_story = {
    'title': '東京の朝',
    'story_text': 'おはようございます。東京に行きます。',
    'sentences': [
        {'text': 'おはようございます。', 'translation': 'Bom dia.'},
        {'text': '東京に行きます。', 'translation': 'Vou para Tóquio.'}
    ],
    'story_dictionary': [
        {'word': 'おはようございます', 'ruby': 'おはようございます', 'translation': 'Bom dia'},
        {'word': '東京', 'ruby': 'とうきょう', 'translation': 'Tóquio'},
        {'word': '行きます', 'ruby': 'いきます', 'translation': 'vou / ir'}
    ],
    'target_vocabulary': [
        {'word': '東京', 'ruby': 'とうきょう', 'translation': 'Tóquio'}
    ]
}

res = _enrich_story_response(mock_story, 'ja')

print("--- DICTIONARY ---")
for d in res['dictionary']:
    print(f"  {d['word']} -> {d['ruby']}")

print("\n--- SENTENCE TOKENS ---")
for s in res['sentences']:
    print(f"Sentence: {s['text']}")
    for t in s['tokens']:
        print(f"  [{t['text']}] ruby={t.get('ruby')} trans={t.get('translation')}")
