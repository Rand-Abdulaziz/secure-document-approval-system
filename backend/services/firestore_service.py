from google.cloud import firestore


db = firestore.Client()


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
        **saved_doc.to_dict()
    }


def list_documents():
    docs = db.collection("documents").order_by("created_at", direction=firestore.Query.DESCENDING).stream()

    results = []
    for doc in docs:
        results.append({
            "id": doc.id,
            **doc.to_dict()
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
        **updated_doc.to_dict()
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
        **updated_doc.to_dict()
    }

def get_document_by_id(document_id):
    doc_ref = db.collection("documents").document(document_id)
    doc = doc_ref.get()

    if not doc.exists:
        return None

    return {
        "id": doc.id,
        **doc.to_dict()
    }


def increment_download_count(document_id):
    doc_ref = db.collection("documents").document(document_id)

    doc_ref.update({
        "download_count": firestore.Increment(1),
        "updated_at": firestore.SERVER_TIMESTAMP,
    })

    updated_doc = doc_ref.get()

    return {
        "id": updated_doc.id,
        **updated_doc.to_dict()
    }
    
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
        **saved_doc.to_dict()
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
            **doc.to_dict()
        })

    return results


def mark_notification_as_read(notification_id):
    doc_ref = db.collection("notifications").document(notification_id)
    doc_ref.update({
        "is_read": True
    })

    updated_doc = doc_ref.get()

    return {
        "id": updated_doc.id,
        **updated_doc.to_dict()
    }

def create_audit_log(username, action, status, details="", document_id=None, ip_address=None):
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
        **saved_doc.to_dict()
    }


def list_audit_logs():
    docs = (
        db.collection("audit_logs")
        .order_by("created_at", direction=firestore.Query.DESCENDING)
        .stream()
    )

    results = []

    for doc in docs:
        results.append({
            "id": doc.id,
            **doc.to_dict()
        })

    return results

def seed_default_users():
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
        doc_ref = db.collection("users").document(user["username"])

        if not doc_ref.get().exists:
            doc_ref.set(user)
            print(f"Created default user: {user['username']}")
