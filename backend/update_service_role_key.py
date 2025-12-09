"""
Script to update .env file with service role key
Run this to update your SUPABASE_KEY to use the service role key
"""
import os
from pathlib import Path

# Service role key provided by user
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrZnNrd2ZrbXRiYXB6amV0cXBjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjI0NjI2MSwiZXhwIjoyMDc3ODIyMjYxfQ.xTeQuS8711WRC8nCHHfVXq67NeAzvsOObRRgbQD3VFI"

def update_env_file():
    """Update .env file with service role key"""
    env_path = Path(__file__).parent / "app" / ".env"
    
    print(f"\n🔧 Updating .env file...")
    print(f"   Path: {env_path}")
    
    if not env_path.exists():
        print(f"❌ .env file not found at {env_path}")
        print(f"   Creating new .env file...")
        # Create new .env file
        env_content = f"""# VISOR Environment Variables
# Supabase Configuration
SUPABASE_URL=https://akfskwfkmtbapzjetqpc.supabase.co
SUPABASE_KEY={SERVICE_ROLE_KEY}

# JWT Configuration
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
"""
        env_path.write_text(env_content)
        print(f"✅ Created new .env file with service role key")
        return
    
    # Read existing .env file
    try:
        with open(env_path, 'r') as f:
            lines = f.readlines()
    except Exception as e:
        print(f"❌ Error reading .env file: {str(e)}")
        return
    
    # Update SUPABASE_KEY line
    updated = False
    new_lines = []
    for line in lines:
        if line.startswith('SUPABASE_KEY='):
            new_lines.append(f'SUPABASE_KEY={SERVICE_ROLE_KEY}\n')
            updated = True
            print(f"   ✅ Updated SUPABASE_KEY")
        else:
            new_lines.append(line)
    
    # If SUPABASE_KEY wasn't found, add it
    if not updated:
        new_lines.append(f'\nSUPABASE_KEY={SERVICE_ROLE_KEY}\n')
        print(f"   ✅ Added SUPABASE_KEY")
    
    # Write back to file
    try:
        with open(env_path, 'w') as f:
            f.writelines(new_lines)
        print(f"✅ Successfully updated .env file with service role key!")
        print(f"\n🔐 Security Note:")
        print(f"   - Service role key is now in .env (which is in .gitignore)")
        print(f"   - NEVER commit this key to git!")
        print(f"\n🔄 Next Steps:")
        print(f"   1. Restart your backend server")
        print(f"   2. You should see: '✅ Using SUPABASE_KEY (assuming it's service role key)'")
        print(f"   3. Try logging in again - it should work now!")
    except Exception as e:
        print(f"❌ Error writing .env file: {str(e)}")

if __name__ == "__main__":
    update_env_file()

