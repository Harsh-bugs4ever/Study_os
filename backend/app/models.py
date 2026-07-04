import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base


def now(): return datetime.now(timezone.utc)


class AppRole(str, enum.Enum):
    admin = "admin"
    user = "user"


class User(Base):
    __tablename__ = "users"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    encrypted_password: Mapped[str | None] = mapped_column(String(255))
    raw_user_meta_data: Mapped[dict] = mapped_column(JSON, default=dict)
    email_confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=now)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    token_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    revoked: Mapped[bool] = mapped_column(Boolean, default=False)


class Profile(Base):
    __tablename__ = "profiles"
    id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    name: Mapped[str] = mapped_column(Text, default="")
    exam_type: Mapped[str | None] = mapped_column(Text, default="")
    subjects: Mapped[list[str] | None] = mapped_column(ARRAY(Text), default=list)
    study_time: Mapped[str | None] = mapped_column(Text, default="")
    mood: Mapped[str | None] = mapped_column(Text, default="")
    xp: Mapped[int | None] = mapped_column(Integer, default=0)
    streak: Mapped[int | None] = mapped_column(Integer, default=0)
    hero_level: Mapped[int | None] = mapped_column(Integer, default=1)
    hero_title: Mapped[str | None] = mapped_column(Text, default="Beginner")
    burnout_score: Mapped[int | None] = mapped_column(Integer, default=0)
    readiness_score: Mapped[int | None] = mapped_column(Integer, default=50)
    onboarding_complete: Mapped[bool | None] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)


class Stream(Base):
    __tablename__ = "streams"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(Text)
    description: Mapped[str | None] = mapped_column(Text)
    icon: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=now)


class Subject(Base):
    __tablename__ = "subjects"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(Text)
    stream_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("streams.id", ondelete="CASCADE"))
    icon: Mapped[str | None] = mapped_column(Text)
    description: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=now)


class Topic(Base):
    __tablename__ = "topics"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(Text)
    subject_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("subjects.id", ondelete="CASCADE"))
    description: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=now)


class SubTopic(Base):
    __tablename__ = "sub_topics"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(Text)
    topic_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("topics.id", ondelete="CASCADE"))
    description: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=now)


class Material(Base):
    __tablename__ = "materials"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(Text)
    type: Mapped[str] = mapped_column(Text)
    url: Mapped[str] = mapped_column(Text)
    sub_topic_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("sub_topics.id", ondelete="CASCADE"))
    year: Mapped[int | None] = mapped_column(Integer)
    file_size: Mapped[str | None] = mapped_column(Text)
    duration: Mapped[str | None] = mapped_column(Text)
    thumbnail_url: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=now)


class JournalEntry(Base):
    __tablename__ = "journal_entries"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    content: Mapped[str] = mapped_column(Text)
    mood: Mapped[str | None] = mapped_column(Text)
    prompt_used: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=now)


class UserRole(Base):
    __tablename__ = "user_roles"
    __table_args__ = (UniqueConstraint("user_id", "role"),)
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    role: Mapped[AppRole] = mapped_column(Enum(AppRole, name="app_role"))


class KnowledgeDocument(Base):
    __tablename__ = "knowledge_documents"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), index=True)
    storage_key: Mapped[str] = mapped_column(Text, unique=True)
    title: Mapped[str] = mapped_column(Text)
    media_type: Mapped[str | None] = mapped_column(Text)
    size_bytes: Mapped[int | None] = mapped_column(Integer)
    cognee_dataset: Mapped[str] = mapped_column(Text, index=True)
    ingestion_status: Mapped[str] = mapped_column(String(24), default="pending", index=True)
    ingestion_error: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    cognified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class StudentMemory(Base):
    __tablename__ = "student_memories"
    __table_args__ = (UniqueConstraint("user_id", "kind", "memory_key"),)
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    kind: Mapped[str] = mapped_column(String(32), index=True)
    memory_key: Mapped[str] = mapped_column(Text)
    value: Mapped[dict] = mapped_column(JSON)
    pinned: Mapped[bool] = mapped_column(Boolean, default=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    subject: Mapped[str] = mapped_column(Text)
    topic: Mapped[str] = mapped_column(Text, index=True)
    correct: Mapped[int] = mapped_column(Integer)
    total: Mapped[int] = mapped_column(Integer)
    details: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class ConceptNode(Base):
    __tablename__ = "concept_nodes"
    __table_args__ = (UniqueConstraint("user_id", "slug"),)
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(Text)
    slug: Mapped[str] = mapped_column(Text, index=True)
    difficulty: Mapped[str] = mapped_column(String(24), default="intermediate")
    mastery: Mapped[int] = mapped_column(Integer, default=0)
    documents: Mapped[list[dict]] = mapped_column(JSON, default=list)
    memories: Mapped[list[dict]] = mapped_column(JSON, default=list)
    quiz_history: Mapped[list[dict]] = mapped_column(JSON, default=list)
    chat_history: Mapped[list[dict]] = mapped_column(JSON, default=list)
    study_recommendations: Mapped[list[dict]] = mapped_column(JSON, default=list)
    weaknesses: Mapped[list[str]] = mapped_column(JSON, default=list)
    metadata_json: Mapped[dict] = mapped_column("metadata", JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)


class ConceptEdge(Base):
    __tablename__ = "concept_edges"
    __table_args__ = (UniqueConstraint("user_id", "source_id", "target_id", "relationship"),)
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    source_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("concept_nodes.id", ondelete="CASCADE"), index=True)
    target_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("concept_nodes.id", ondelete="CASCADE"), index=True)
    relationship: Mapped[str] = mapped_column(String(40), default="related")
    strength: Mapped[int] = mapped_column(Integer, default=50)
    evidence: Mapped[list[dict]] = mapped_column(JSON, default=list)
    metadata_json: Mapped[dict] = mapped_column("metadata", JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)


TABLE_MODELS = {m.__tablename__: m for m in (Profile, Stream, Subject, Topic, SubTopic, Material, JournalEntry, UserRole)}
