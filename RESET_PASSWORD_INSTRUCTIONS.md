# Reset Password for User 'asillah'

## Issue
The password check is failing (401 Unauthorized) even though the password should be correct. This is likely because:
1. The password hash in the database doesn't match
2. The password was stored incorrectly
3. There's an encoding issue

## Solution: Reset Password in Supabase

Since RLS might be blocking the Python script, use Supabase SQL Editor directly.

### Step 1: Generate Password Hash

Run this Python command to generate the bcrypt hash:

```python
import bcrypt
password = "asillah"
hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
print(hashed)
```

Or use the script:
```bash
python reset_password_sql.py
```

### Step 2: Update in Supabase SQL Editor

1. Go to Supabase Dashboard → SQL Editor
2. Run this SQL (replace `YOUR_HASH_HERE` with the hash from Step 1):

```sql
UPDATE "User"
SET hashed_password = 'YOUR_HASH_HERE',
    temp_password = false
WHERE username = 'asillah';
```

### Step 3: Verify Update

Check if it worked:
```sql
SELECT username, "Account_status", role, temp_password 
FROM "User" 
WHERE username = 'asillah';
```

### Step 4: Try Login Again

1. Restart backend (if needed)
2. Try logging in with:
   - Username: `asillah`
   - Password: `asillah`

---

## Alternative: Quick Python Script

If you want to run it from Python (if RLS allows):

```python
import bcrypt
from app.database.connection import get_db

db = get_db()
password = "asillah"
hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

# Update password
db.table("User").update({
    "hashed_password": hashed,
    "temp_password": False
}).eq("username", "asillah").execute()

print("Password reset complete!")
```

---

## Why This Happens

The 401 error means:
- ✅ User exists
- ✅ Account is ACTIVE
- ❌ Password hash doesn't match

This usually happens when:
- Password was set manually without proper bcrypt hashing
- Password hash got corrupted
- Different hashing method was used

