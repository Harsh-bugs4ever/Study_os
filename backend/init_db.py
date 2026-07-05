from app.database import Base, engine
from app import models

print("Creating all database tables...")
Base.metadata.create_all(bind=engine)
print("Done! All tables created successfully.")
