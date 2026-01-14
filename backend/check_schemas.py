
import sys
import os

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    import app.database.schemas as schemas
    print(f"File: {schemas.__file__}")
    print("Attributes:")
    print([x for x in dir(schemas) if 'Report' in x])
except Exception as e:
    print(f"Error: {e}")
