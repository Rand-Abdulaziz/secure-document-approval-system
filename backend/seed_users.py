from google.cloud import firestore

db = firestore.Client()

users = [
    {
        "username": "admin",
        "password": "admin123",
        "role": "admin",
    },
    {
        "username": "employee",
        "password": "employee123",
        "role": "employee",
    },
]

for user in users:
    db.collection("users").document(user["username"]).set(user)
    print(f"Created user: {user['username']}")

print("Seed completed successfully.")