
import requests
import json
import sys

try:
    response = requests.get("http://localhost:8000/api/equipment/")
    data = response.json()
    with open("debug_verification_restored.txt", "w", encoding="utf-8") as f:
        for eq in data:
            if eq.get('photos'):
                f.write(f"Equipment: {eq.get('equipment_tag_no')}\n")
                f.write(f"  Main Image URL: {eq.get('image_url')}\n")
                for p in eq['photos']:
                    f.write(f"  - Photo ID: {p.get('id')}\n")
                    f.write(f"    Part View: '{p.get('part_view')}'\n") # Check if this is populated
                    f.write(f"    Image URL: '{p.get('image_url')}'  <-- VERIFY THIS\n")
                    f.write("-" * 20 + "\n")
except Exception as e:
    with open("debug_verification_restored.txt", "w", encoding="utf-8") as f:
        f.write(str(e))
