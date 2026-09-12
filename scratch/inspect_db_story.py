from backend.database import SessionLocal, StoryModel
import json
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

db = SessionLocal()
latest_story = db.query(StoryModel).order_by(StoryModel.created_at.desc()).first()
if latest_story:
    print(f"Title: {latest_story.title}")
    print(f"Language: {latest_story.language}")
    print(f"Sentences count: {len(latest_story.sentences_json)}")
    if latest_story.sentences_json:
        first_s = latest_story.sentences_json[0]
        print(f"First sentence: {first_s}")
    print("\nStory Dictionary:")
    for d in (latest_story.story_dictionary_json or [])[:5]:
        print(f"  {d}")
else:
    print("No stories found.")
db.close()
