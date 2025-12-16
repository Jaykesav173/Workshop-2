import requests
import json
import uuid
import random

url = "http://127.0.0.1:8000/api/equipment/"

def test_create(tag):
    payload = {
        "equipment_tag_no": tag,
        "equipment_description": "Test Equipment " + tag,
        "type_id": 11001,
        "material": "Carbon Steel",
        "location": "Plant A",
        "dosh_registration_no": "DOSH-" + tag,
        "nominal_thickness": 10.5,
        "corrosion_allowance": 3.0,
        "design_pressure": 15.0,
        "design_temperature": 120.0,
        "status": "ACTIVE"
    }
    try:
        print(f"Testing create with tag: {tag}")
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print("Success!")
        else:
            print(f"Failed: {response.text}")
    except Exception as e:
        print(f"Request failed: {e}")

# 1. Test Success (Random Tag)
random_tag = f"TAG-{uuid.uuid4().hex[:6].upper()}"
test_create(random_tag)

# 2. Test Duplicate (Same Tag)
print("\nTesting Duplicate...")
test_create(random_tag)
