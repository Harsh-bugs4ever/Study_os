from app.database import SessionLocal
from app.models import User, Profile, AppRole, UserRole
import uuid
from datetime import datetime, timezone

def test_db():
    db = SessionLocal()
    try:
        uid = uuid.uuid4()
        print(f"Testing with UID: {uid}")
        
        # Insert user
        user = User(
            id=uid,
            email=f"test_{uid}@example.com",
            encrypted_password=None,
            email_confirmed_at=datetime.now(timezone.utc),
            raw_user_meta_data={},
        )
        db.add(user)
        db.flush()
        print("User flushed successfully.")
        
        # Insert profile
        profile = Profile(id=uid, name="Test Profile")
        db.add(profile)
        db.flush()
        print("Profile flushed successfully.")
        
        db.commit()
        print("Commit successful!")
    except Exception as e:
        db.rollback()
        print(f"Error occurred: {type(e).__name__}")
        print(e)
    finally:
        db.close()

if __name__ == "__main__":
    test_db()
