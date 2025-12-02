import requests
import json

url = "http://127.0.0.1:8000/api/equipment/options"

try:
    response = requests.get(url)
    data = response.json()
    if "types" in data and len(data["types"]) > 0:
        print(f"Valid Type ID: {data['types'][0]['id']}")
    else:
        print("No types found.")
except Exception as e:
    print(f"Request failed: {e}")
