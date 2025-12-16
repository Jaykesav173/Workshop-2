import requests
import json

url = "http://127.0.0.1:8000/api/equipment/"

payload = {
    "equipment_tag_no": "TEST-TAG-001",
    "equipment_description": "Test Equipment",
    "type_id": 11001,
    "material": "Carbon Steel",
    "location": "Plant A",
    "dosh_registration_no": "DOSH-123",
    "nominal_thickness": 10.5,
    "corrosion_allowance": 3.0,
    "design_pressure": 15.0,
    "design_temperature": 120.0,
    "status": "ACTIVE"
}

try:
    print(f"Sending payload: {json.dumps(payload, indent=2)}")
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.text}")
except Exception as e:
    print(f"Request failed: {e}")
