"""
Inspection Schedule Service
Business logic for inspection schedule management
"""
from fastapi import HTTPException
from app.database.connection import get_db
from typing import List, Dict, Any

def get_available_inspectors(db: Any) -> List[Dict]:
    """Get list of available inspectors (users with INSPECTOR role)"""
    try:
        # Fetch users with INSPECTOR role
        res = db.table("User").select("id, username, email, name").eq("role", "INSPECTOR").eq("Account_status", "ACTIVE").execute()
        
        if res.data:
            return res.data
        return []
    except Exception as e:
        # Log the error but return empty list instead of raising
        import traceback
        print(f"❌ Error fetching available inspectors: {e}")
        print(traceback.format_exc())
        return []

