from google.cloud import firestore
from werkzeug.security import generate_password_hash


db = firestore.Client()


def serialize_firestore_data(data):
    result = {}

    for key, value in data.items():
        if hasattr(value, "isoformat"):
            result[key] = value.isoformat()
        else:
            result[key] = value

    return result


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


def create_document(data):
    doc_ref = db.collection("documents").document()

    doc_ref.set({
        **data,
        "status": "pending",
        "created_at": firestore.SERVER_TIMESTAMP,
        "updated_at": firestore.SERVER_TIMESTAMP,
    })

    saved_doc = doc_ref.get()

    return {
        "id": doc_ref.id,
        **serialize_firestore_data(saved_doc.to_dict())
    }


def list_documents():
    docs = (
        db.collection("documents")
        .order_by(
            "created_at",
            direction=firestore.Query.DESCENDING
        )
        .stream()
    )

    results = []

    for doc in docs:
        results.append({
            "id": doc.id,
            **serialize_firestore_data(doc.to_dict())
        })

    return results


def update_document_status(document_id, status, rejection_reason=None):
    doc_ref = db.collection("documents").document(document_id)

    doc_snapshot = doc_ref.get()

    if not doc_snapshot.exists:
        return None, "Document not found"

    current_doc = doc_snapshot.to_dict()

    if current_doc.get("status") != "pending":
        return None, "Only pending documents can be reviewed"

    update_data = {
        "status": status,
        "updated_at": firestore.SERVER_TIMESTAMP,
    }

    if rejection_reason:
        update_data["rejection_reason"] = rejection_reason

    doc_ref.update(update_data)

    updated_doc = doc_ref.get()

    return {
        "id": updated_doc.id,
        **serialize_firestore_data(updated_doc.to_dict())
    }, None


def update_document_access_settings(document_id, allow_download, download_limit):
    doc_ref = db.collection("documents").document(document_id)

    doc_ref.update({
        "allow_download": allow_download,
        "download_limit": download_limit,
        "updated_at": firestore.SERVER_TIMESTAMP,
    })

    updated_doc = doc_ref.get()

    return {
        "id": updated_doc.id,
        **serialize_firestore_data(updated_doc.to_dict())
    }


def get_document_by_id(document_id):
    doc_ref = db.collection("documents").document(document_id)

    doc = doc_ref.get()

    if not doc.exists:
        return None

    return {
        "id": doc.id,
        **serialize_firestore_data(doc.to_dict())
    }


@firestore.transactional
def _reserve_user_download(transaction, usage_ref, download_limit):
    usage_snapshot = usage_ref.get(transaction=transaction)

    if usage_snapshot.exists:
        download_count = usage_snapshot.to_dict().get("download_count", 0)
    else:
        download_count = 0

    if download_limit > 0 and download_count >= download_limit:
        return {
            "allowed": False,
            "download_count": download_count,
        }

    new_download_count = download_count + 1

    transaction.set(
        usage_ref,
        {
            "username": usage_ref.id,
            "download_count": new_download_count,
            "updated_at": firestore.SERVER_TIMESTAMP,
        },
        merge=True,
    )

    return {
        "allowed": True,
        "download_count": new_download_count,
    }


def reserve_user_download(document_id, username, download_limit):
    usage_ref = (
        db.collection("documents")
        .document(document_id)
        .collection("download_usage")
        .document(username)
    )

    transaction = db.transaction()

    return _reserve_user_download(
        transaction,
        usage_ref,
        download_limit,
    )


def get_user_download_count(document_id, username):
    usage_ref = (
        db.collection("documents")
        .document(document_id)
        .collection("download_usage")
        .document(username)
    )

    usage_doc = usage_ref.get()

    if not usage_doc.exists:
        return 0

    return usage_doc.to_dict().get("download_count", 0)


def create_notification(user_id, document_id, notification_type, title, message):
    doc_ref = db.collection("notifications").document()

    doc_ref.set({
        "user_id": user_id,
        "document_id": document_id,
        "type": notification_type,
        "title": title,
        "message": message,
        "is_read": False,
        "created_at": firestore.SERVER_TIMESTAMP,
    })

    saved_doc = doc_ref.get()

    return {
        "id": doc_ref.id,
        **serialize_firestore_data(saved_doc.to_dict())
    }


def list_notifications_for_user(user_id):
    docs = (
        db.collection("notifications")
        .where("user_id", "==", user_id)
        .stream()
    )

    results = []

    for doc in docs:
        results.append({
            "id": doc.id,
            **serialize_firestore_data(doc.to_dict())
        })

    return results


def mark_notification_as_read(notification_id, username):
    doc_ref = db.collection("notifications").document(notification_id)

    doc = doc_ref.get()

    if not doc.exists:
        return None

    notification_data = doc.to_dict()

    if notification_data.get("user_id") != username:
        return None

    doc_ref.update({
        "is_read": True,
        "updated_at": firestore.SERVER_TIMESTAMP,
    })

    updated_doc = doc_ref.get()

    return {
        "id": updated_doc.id,
        **serialize_firestore_data(updated_doc.to_dict()),
    }


def create_audit_log(
    username,
    action,
    status,
    details="",
    document_id=None,
    ip_address=None
):
    doc_ref = db.collection("audit_logs").document()

    log_data = {
        "username": username,
        "action": action,
        "status": status,
        "details": details,
        "ip_address": ip_address,
        "created_at": firestore.SERVER_TIMESTAMP,
    }

    if document_id:
        log_data["document_id"] = document_id

    doc_ref.set(log_data)

    saved_doc = doc_ref.get()

    return {
        "id": doc_ref.id,
        **serialize_firestore_data(saved_doc.to_dict())
    }


def list_audit_logs():
    docs = (
        db.collection("audit_logs")
        .order_by(
            "created_at",
            direction=firestore.Query.DESCENDING
        )
        .stream()
    )

    results = []

    for doc in docs:
        results.append({
            "id": doc.id,
            **serialize_firestore_data(doc.to_dict())
        })

    return results


def seed_default_users():
    users = [
        {
            "username": "admin",
            "default_password": "admin123",
            "role": "admin",
        },
        {
            "username": "employee",
            "default_password": "employee123",
            "role": "employee",
        },
    ]

    for user in users:
        username = user["username"]
        doc_ref = db.collection("users").document(username)
        user_doc = doc_ref.get()

        if not user_doc.exists:
            doc_ref.set(
                {
                    "username": username,
                    "password_hash": generate_password_hash(
                        user["default_password"]
                    ),
                    "role": user["role"],
                    "created_at": firestore.SERVER_TIMESTAMP,
                }
            )

            print(f"Created default user: {username}")
            continue

        existing_user = user_doc.to_dict()

        if (
            existing_user.get("password")
            and not existing_user.get("password_hash")
        ):
            doc_ref.update(
                {
                    "password_hash": generate_password_hash(
                        existing_user["password"]
                    ),
                    "password": firestore.DELETE_FIELD,
                    "updated_at": firestore.SERVER_TIMESTAMP,
                }
            )

            print(f"Migrated password for user: {username}")
