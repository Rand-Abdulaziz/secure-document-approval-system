from google.cloud import firestore
from google.oauth2 import service_account
import os

credentials = service_account.Credentials.from_service_account_file(
    os.path.join(
        os.path.dirname(__file__),
        "..",
        "credentials",
        "service-account.json",
    )
)

db = firestore.Client(
    credentials=credentials,
    project=credentials.project_id,
)


def get_user_by_username(username):
    docs = (
        db.collection("users")
        .where("username", "==", username)
        .limit(1)
        .stream()
    )

    for doc in docs:
        return doc.to_dict()

    return None