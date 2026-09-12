from datetime import datetime
from typing import Generator
import uuid
from sqlalchemy import (
    create_engine,
    Column,
    String,
    Integer,
    Float,
    Boolean,
    Text,
    DateTime,
    JSON,
)
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from .config import settings

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False} if "sqlite" in settings.database_url else {},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class StoryModel(Base):
    __tablename__ = "stories"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(256), nullable=False)
    title_translation = Column(String(256), default="")
    language = Column(String(16), nullable=False)
    proficiency = Column(String(32), default="A2")
    theme = Column(String(128), default="General")
    story_length = Column(String(32), default="standard")
    repetition_density = Column(String(32), default="high")
    full_text = Column(Text, default="")
    sentences_json = Column(JSON, default=list)
    story_dictionary_json = Column(JSON, default=list)
    story_translated_dict_json = Column(JSON, default=list)
    quiz_json = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)


class VocabularyModel(Base):
    __tablename__ = "vocabulary"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    language = Column(String(16), index=True, nullable=False)
    word = Column(String(128), index=True, nullable=False)
    lemma = Column(String(128), default="")
    ruby = Column(String(128), default="")
    translation = Column(String(256), default="")
    part_of_speech = Column(String(64), default="Noun")
    definition = Column(Text, default="")
    example_sentence = Column(Text, default="")
    example_translation = Column(Text, default="")
    traits_json = Column(JSON, default=dict)
    mastery_score = Column(Float, default=0.25)
    status_label = Column(String(64), default="CRÍTICO (3-4X)")
    status_color = Column(String(32), default="orange")
    repetition_weight = Column(Integer, default=4)
    looked_up_count = Column(Integer, default=0)
    is_pinned = Column(Boolean, default=False)
    is_starred = Column(Boolean, default=False)
    srs_stage = Column(String(32), default="new")
    srs_interval = Column(Integer, default=1)
    srs_ease_factor = Column(Float, default=2.5)
    srs_repetition = Column(Integer, default=0)
    last_reviewed_at = Column(DateTime, nullable=True)
    next_review_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
