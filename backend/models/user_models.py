from pydantic import BaseModel, EmailStr

class LoginRequest(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    role: str  # 'ADMIN', 'INSPECTOR', 'USER'
    Account_status: str = "ACTIVE"
