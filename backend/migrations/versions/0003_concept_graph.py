"""Add concept knowledge graph tables."""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0003_concept_graph"
down_revision = "0002_cognee_memory"


def upgrade():
    op.create_table(
        "concept_nodes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("slug", sa.Text(), nullable=False),
        sa.Column("difficulty", sa.String(24), nullable=False, server_default="intermediate"),
        sa.Column("mastery", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("documents", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("memories", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("quiz_history", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("chat_history", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("study_recommendations", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("weaknesses", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("metadata", sa.JSON(), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", "slug"),
    )
    op.create_index("ix_concept_nodes_user_id", "concept_nodes", ["user_id"])
    op.create_index("ix_concept_nodes_slug", "concept_nodes", ["slug"])
    op.create_table(
        "concept_edges",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("source_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("concept_nodes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("target_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("concept_nodes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("relationship", sa.String(40), nullable=False, server_default="related"),
        sa.Column("strength", sa.Integer(), nullable=False, server_default="50"),
        sa.Column("evidence", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("metadata", sa.JSON(), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", "source_id", "target_id", "relationship"),
    )
    op.create_index("ix_concept_edges_user_id", "concept_edges", ["user_id"])
    op.create_index("ix_concept_edges_source_id", "concept_edges", ["source_id"])
    op.create_index("ix_concept_edges_target_id", "concept_edges", ["target_id"])


def downgrade():
    op.drop_table("concept_edges")
    op.drop_table("concept_nodes")
