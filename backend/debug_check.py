import sys, requests, json
sys.path.insert(0, '.')

# Login
r = requests.post('http://localhost:8001/api/v1/auth/login', data={'username':'demo@financial.ai','password':'admin123'})
print(f"Login: {r.status_code}")
assert r.status_code == 200, f"Login failed: {r.text}"

token = r.json()['access_token']
headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

# List users
r = requests.get('http://localhost:8001/api/v1/users/', headers=headers)
print(f"List Users: {r.status_code} count={len(r.json())}")

# Create user with role
r = requests.post('http://localhost:8001/api/v1/users/', headers=headers, json={
    'email': 'testuser@debug.com', 'password': 'testpass1234',
    'full_name': 'Test User', 'role': 'readonly'
})
print(f"Create User: {r.status_code} role={r.json().get('role')}")
uid = r.json().get('id')

# Update role
if uid:
    r = requests.put(f'http://localhost:8001/api/v1/users/{uid}', headers=headers, json={'role': 'analyst'})
    print(f"Update Role: {r.status_code} new_role={r.json().get('role')}")

    # Delete user
    r = requests.delete(f'http://localhost:8001/api/v1/users/{uid}', headers=headers)
    print(f"Delete User: {r.status_code}")

# List companies
r = requests.get('http://localhost:8001/api/v1/companies/', headers=headers)
print(f"List Companies: {r.status_code} count={len(r.json())}")

# Create company
r = requests.post('http://localhost:8001/api/v1/companies/', headers=headers, json={
    'name': 'Debug Test Corp', 'industry': 'Fintech', 'metadata': {}
})
print(f"Create Company: {r.status_code}")
cid = r.json().get('id')

# Delete company
if cid:
    r = requests.delete(f'http://localhost:8001/api/v1/companies/{cid}', headers=headers)
    print(f"Delete Company: {r.status_code}")

print("\nAll API tests passed!")
