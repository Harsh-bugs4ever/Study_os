"""Add Cognee document and student-memory metadata."""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
revision = "0002_cognee_memory"
down_revision = "0001_initial"

def upgrade():
    op.create_table("knowledge_documents",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True), sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("storage_key", sa.Text(), nullable=False, unique=True), sa.Column("title", sa.Text(), nullable=False), sa.Column("media_type", sa.Text()), sa.Column("size_bytes", sa.Integer()),
        sa.Column("cognee_dataset", sa.Text(), nullable=False), sa.Column("ingestion_status", sa.String(24), nullable=False, server_default="pending"), sa.Column("ingestion_error", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()), sa.Column("cognified_at", sa.DateTime(timezone=True)))
    for name in ("user_id", "cognee_dataset", "ingestion_status"): op.create_index(f"ix_knowledge_documents_{name}", "knowledge_documents", [name])
    op.create_table("student_memories",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True), sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("kind", sa.String(32), nullable=False), sa.Column("memory_key", sa.Text(), nullable=False), sa.Column("value", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()), sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", "kind", "memory_key"))
    op.create_index("ix_student_memories_user_id", "student_memories", ["user_id"]); op.create_index("ix_student_memories_kind", "student_memories", ["kind"])
    op.create_table("quiz_attempts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True), sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("subject", sa.Text(), nullable=False), sa.Column("topic", sa.Text(), nullable=False), sa.Column("correct", sa.Integer(), nullable=False), sa.Column("total", sa.Integer(), nullable=False),
        sa.Column("details", sa.JSON(), nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()))
    op.create_index("ix_quiz_attempts_user_id", "quiz_attempts", ["user_id"]); op.create_index("ix_quiz_attempts_topic", "quiz_attempts", ["topic"])

def downgrade():
    op.drop_table("quiz_attempts"); op.drop_table("student_memories"); op.drop_table("knowledge_documents")
