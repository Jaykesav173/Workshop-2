import urllib.request
import sys

try:
    with urllib.request.urlopen("http://localhost:8004/api/users") as response:
        print("Server is up!")
except Exception as e:
    print(f"Server check failed: {e}")
    sys.exit(1)
