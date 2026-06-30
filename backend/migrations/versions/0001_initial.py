"""Initial self-hosted PostgreSQL schema."""
from alembic import op
from app.database import Base
from app import models
revision = "0001_initial"
down_revision = None

def upgrade():
    Base.metadata.create_all(bind=op.get_bind())
    op.create_check_constraint("ck_material_type", "materials", "type IN ('pdf','video','pyq')")

def downgrade():
    Base.metadata.drop_all(bind=op.get_bind())
