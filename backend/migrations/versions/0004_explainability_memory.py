"""Add explainable memory dashboard fields."""
from alembic import op
import sqlalchemy as sa

revision = "0004_explainability_memory"
down_revision = "0003_concept_graph"


def upgrade():
    op.add_column("student_memories", sa.Column("pinned", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("student_memories", sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_student_memories_pinned", "student_memories", ["pinned"])
    op.create_index("ix_student_memories_deleted_at", "student_memories", ["deleted_at"])


def downgrade():
    op.drop_index("ix_student_memories_deleted_at", table_name="student_memories")
    op.drop_index("ix_student_memories_pinned", table_name="student_memories")
    op.drop_column("student_memories", "deleted_at")
    op.drop_column("student_memories", "pinned")
