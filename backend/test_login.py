"""
Test script to verify demo account login
"""
import requests
import json

# Test the login endpoint
url = "http://localhost:8000/api/v1/auth/login"
data = {
    "username": "demo@financial.ai",
    "password": "demo123"
}

print("Testing login endpoint...")
print(f"URL: {url}")
print(f"Credentials: {data}")
print()

try:
    response = requests.post(
        url,
        data=data,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        print("\n✓ Login successful!")
        token = response.json().get("access_token")
        print(f"Token: {token[:10]}...")
        
        # Now test fetching the user
        print("\nTesting /users/me endpoint...")
        user_url = "http://localhost:8000/api/v1/users/me"
        user_response = requests.get(
            user_url,
            headers={"Authorization": f"Bearer {token}"}
        )
        print(f"Status Code: {user_response.status_code}")
        print(f"Response: {user_response.text}")
        
        if user_response.status_code == 200:
            print("✓ Fetch user successful!")
        else:
            print("✗ Fetch user failed!")

    else:
        print("\n✗ Login failed!")
        
except Exception as e:
    print(f"Error: {e}")
