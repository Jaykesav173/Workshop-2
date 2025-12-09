"""
Authentication Service - Haifa
Business logic for authentication operations
"""
import bcrypt
from fastapi import HTTPException
from app.database.connection import get_db
from app.database.schemas import LoginRequest, LoginResponse, UserCreate, UserResponse
from app.utils.jwt_utils import create_access_token
from datetime import datetime

class AuthService:
    def __init__(self):
        self.db = get_db()
    
    async def login(self, credentials: LoginRequest) -> LoginResponse:
        """Authenticate user and return JWT token"""
        try:
            # Normalize username (strip whitespace, but keep case for now)
            username = credentials.username.strip() if credentials.username else ""
            password = credentials.password
            
            if not username or not password:
                raise HTTPException(status_code=400, detail="Username and password are required")
            
            print(f"\n🔍 LOGIN ATTEMPT:")
            print(f"   Username: '{username}' (length: {len(username)})")
            print(f"   Password length: {len(password)}")
            
            # Use simple table name "User" (Supabase adds public. automatically)
            # Note: If RLS is enabled, make sure service role key has bypass permissions
            res = self.db.table("User").select(
                "id, username, hashed_password, role, \"Account_status\""
            ).eq("username", username).execute()
            
            # If not found, try case-insensitive search (for debugging)
            if not res.data:
                print(f"   ⚠️  Exact match not found, trying case-insensitive...")
                all_users = self.db.table("User").select("id, username").execute()
                    
                if all_users.data:
                    print(f"   Available usernames in DB: {[u.get('username') for u in all_users.data]}")
                    # Try case-insensitive match
                    for user in all_users.data:
                        if user.get('username', '').lower() == username.lower():
                            print(f"   ✅ Found case-insensitive match: '{user.get('username')}'")
                            res = self.db.table("User").select(
                                "id, username, hashed_password, role, \"Account_status\""
                            ).eq("id", user.get('id')).execute()
                            break
                else:
                    print(f"   ⚠️  No users found in database - possible RLS issue or empty table")
            
            if not res.data:
                print(f"❌ User '{username}' not found in database")
                raise HTTPException(status_code=401, detail="Invalid username or password")
            
            user = res.data[0]
            print(f"✅ User found: ID={user['id']}, Role={user.get('role')}, Status={user.get('Account_status')}")
            
            if user["Account_status"] != "ACTIVE":
                print(f"❌ Account is not ACTIVE: {user['Account_status']}")
                raise HTTPException(status_code=403, detail="Account inactive. Please contact admin.")
            
            # Check password - handle both string and bytes
            stored_hash = user["hashed_password"]
            if isinstance(stored_hash, bytes):
                stored_hash = stored_hash.decode("utf-8")
            
            # Strip any whitespace from hash
            stored_hash = stored_hash.strip() if stored_hash else ""
            
            print(f"   Hash length: {len(stored_hash)}")
            print(f"   Hash starts with: {stored_hash[:7] if stored_hash else 'None'}")
            
            # Validate hash format
            if not stored_hash or not stored_hash.startswith(('$2a$', '$2b$', '$2y$')):
                print(f"❌ ERROR: Invalid password hash format for user {credentials.username}")
                print(f"   Hash preview: {stored_hash[:50] if stored_hash else 'None'}...")
                raise HTTPException(status_code=500, detail="Invalid password hash format in database. Please reset password.")
            
            try:
                password_bytes = credentials.password.encode("utf-8")
                hash_bytes = stored_hash.encode("utf-8")
                
                print(f"   Checking password...")
                password_match = bcrypt.checkpw(password_bytes, hash_bytes)
                print(f"   Password check result: {password_match}")
                
                if not password_match:
                    print(f"❌ Password does NOT match for user {credentials.username}")
                    raise HTTPException(status_code=401, detail="Invalid username or password")
                
                print(f"✅ Password is CORRECT!")
            except ValueError as e:
                print(f"❌ ERROR: Password check failed - {str(e)}")
                print(f"   Hash format issue for user {credentials.username}")
                raise HTTPException(status_code=500, detail="Password verification error. Hash may be corrupted.")
            
            # Create JWT token
            token = create_access_token(data={"sub": user["username"], "id": user["id"], "role": user["role"]})
            
            return LoginResponse(
                success=True,
                message="Login successful",
                access_token=token,
                user={
                    "id": user["id"],
                    "username": user["username"],
                    "role": user["role"]
                }
            )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Server error during login: {str(e)}")
    
    async def register(self, user_data: UserCreate) -> UserResponse:
        """Register a new user"""
        try:
            # Check for duplicates - use simple table name "User"
            existing = self.db.table("User").select("id").or_(
                f"username.eq.{user_data.username},email.eq.{user_data.email}"
            ).execute()
            
            if existing.data:
                raise HTTPException(status_code=400, detail="Username or email already exists")
            
            # Hash password
            hashed_pw = bcrypt.hashpw(user_data.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
            
            new_user = {
                "name": user_data.name,
                "email": user_data.email,
                "username": user_data.username,
                "hashed_password": hashed_pw,
                "role": user_data.role,
                "Account_status": user_data.Account_status,
                "created_at": str(datetime.utcnow())
            }
            
            res = self.db.table("User").insert(new_user).execute()
            
            if res.data:
                user = res.data[0]
                user.pop("hashed_password", None)
                return UserResponse(**user)
            else:
                raise HTTPException(status_code=400, detail="Failed to register user")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Server error during registration: {str(e)}")

