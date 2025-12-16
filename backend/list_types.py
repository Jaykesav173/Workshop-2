import requests
import json

url = "http://127.0.0.1:8000/api/equipment/options"

try:
    response = requests.get(url)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.text}")
except Exception as e:
    print(f"Request failed: {e}")
