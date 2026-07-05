from app.database import SessionLocal
from app.models import User
from sqlalchemy import delete

with SessionLocal() as db:
    # Delete any user with the same email but a different ID
    target_email = "harshsinghathena@gmail.com"
    target_id = "7bf42ba3-d0c0-4d9c-81fe-0b67fd6d51bb"
    
    # Delete old user
    result = db.execute(delete(User).where(User.email == target_email, User.id != target_id))
    db.commit()
    print(f"Deleted {result.rowcount} old shadow users for {target_email}!")
