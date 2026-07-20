async function checkSession() {
    try {
        const session = await apiRequest("/session");

        if (!session.authenticated) {
            window.location.href = "login.html";
            return;
        }

        if (session.role !== "admin") {
            window.location.href = "employee.html";
            return;
        }

    } catch (error) {
        window.location.href = "login.html";
    }
}


async function loadDashboard() {
    const documents = await apiRequest("/documents");
    const notifications = await apiRequest("/notifications");
    const auditLogs = await apiRequest("/audit-logs");

    renderStats(documents);
    renderDocuments(documents);
    renderNotifications(notifications);
    renderAuditLogs(auditLogs);

    const approvedDocuments = documents.filter(
        doc => doc.status === "approved"
    );

    renderApprovedDocuments(approvedDocuments);
}


function renderStats(documents) {
    document.getElementById("totalDocs").textContent = documents.length;

    document.getElementById("pendingDocs").textContent =
        documents.filter(d => d.status === "pending").length;

    document.getElementById("approvedDocs").textContent =
        documents.filter(d => d.status === "approved").length;

    document.getElementById("rejectedDocs").textContent =
        documents.filter(d => d.status === "rejected").length;
}


function renderDocuments(documents) {

    const table = document.getElementById("documentsTable");
    table.innerHTML = "";

    documents.slice(0, 8).forEach((doc) => {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${doc.original_filename || "Untitled"}</td>
            <td>${doc.uploaded_by || "-"}</td>
            <td>
                <span class="badge ${doc.status}">
                    ${doc.status}
                </span>
            </td>

            <td>
                ${doc.status === "pending"
                ?
                `
                    <button class="action-btn"
                    onclick="approveDocument('${doc.id}')">
                    Approve
                    </button>

                    <button class="action-btn reject-btn"
                    onclick="rejectDocument('${doc.id}')">
                    Reject
                    </button>
                    `
                :
                "-"
            }
            </td>
        `;

        table.appendChild(row);
    });
}

function formatNotificationDate(createdAt) {
    if (!createdAt) {
        return "Date unavailable";
    }

    const date = new Date(createdAt);

    if (Number.isNaN(date.getTime())) {
        return "Date unavailable";
    }

    return date.toLocaleString();
}

function renderNotifications(notifications) {
    const list = document.getElementById("notificationsList");

    if (!list) {
        return;
    }

    list.innerHTML = "";

    if (!notifications.length) {
        list.innerHTML = `<p class="muted">No notifications yet.</p>`;
        return;
    }

    notifications.slice(0, 5).forEach((notification) => {
        const div = document.createElement("div");

        div.className = notification.is_read
            ? "activity-item notification-read"
            : "activity-item notification-unread";

        div.innerHTML = `
            <div class="notification-header">
                <strong>
                    ${notification.title || "Notification"}
                </strong>

                <span class="notification-status">
                    ${notification.is_read ? "Read" : "Unread"}
                </span>
            </div>

            <p>
                ${notification.message || ""}
            </p>

            <small class="notification-date">
                ${formatNotificationDate(notification.created_at)}
            </small>

            ${notification.is_read
                ? ""
                : `
                        <button
                            class="action-btn"
                            onclick="markDashboardNotificationAsRead('${notification.id}')"
                        >
                            Mark as read
                        </button>
                    `
            }
        `;

        list.appendChild(div);
    });
}

async function markDashboardNotificationAsRead(notificationId) {
    try {
        await apiRequest(
            `/notifications/${notificationId}/read`,
            {
                method: "POST"
            }
        );

        await loadDashboard();

    } catch (error) {
        alert(error.message);
    }
}


function renderAuditLogs(logs) {
    const list = document.getElementById("auditLogsList");

    if (!list) {
        return;
    }

    list.innerHTML = "";

    if (!logs.length) {
        list.innerHTML = `
            <p class="muted">
                No audit logs yet.
            </p>
        `;

        return;
    }

    logs.slice(0, 6).forEach((log) => {
        const div = document.createElement("div");

        div.className = "activity-item";

        div.innerHTML = `
            <div class="audit-log-header">
                <strong>
                    ${log.action || "UNKNOWN"}
                </strong>

                <span class="audit-status ${String(log.status || "").toLowerCase()}">
                    ${log.status || "UNKNOWN"}
                </span>
            </div>

            <p>
                ${log.details || "No details available."}
            </p>

            <div class="audit-log-meta">
                <span>
                    User: ${log.username || "unknown"}
                </span>

                <span>
                    ${formatNotificationDate(log.created_at)}
                </span>
            </div>
        `;

        list.appendChild(div);
    });
}


async function approveDocument(id) {

    await apiRequest(`/documents/${id}/approve`, {
        method: "POST"
    });

    await loadDashboard();
}


async function rejectDocument(id) {

    const reason = prompt("Reason for rejection:");

    await apiRequest(`/documents/${id}/reject`, {

        method: "POST",

        body: JSON.stringify({
            reason: reason || "No reason provided"
        })
    });

    await loadDashboard();
}



const logoutButton = document.getElementById("logoutButton");


if (logoutButton) {

    logoutButton.addEventListener("click", async () => {

        try {

            await apiRequest("/logout", {
                method: "POST"
            });

            window.location.href = "login.html";

        } catch (error) {

            alert(error.message);

        }

    });

}



(async () => {

    await checkSession();

    await loadDashboard();

})();



function renderApprovedDocuments(documents) {

    const table = document.getElementById(
        "approvedDocumentsTable"
    );

    table.innerHTML = "";


    if (!documents.length) {

        table.innerHTML = `
            <tr>
                <td colspan="5">
                    No approved documents.
                </td>
            </tr>
        `;

        return;
    }



    documents.forEach((doc) => {


        const row = document.createElement("tr");


        row.innerHTML = `

            <td>
                <strong>
                    ${doc.title || doc.original_filename}
                </strong>
                <br>
                <small>
                    ${doc.description || ""}
                </small>
            </td>


            <td>
                ${doc.uploaded_by}
            </td>


            <td>
                ${doc.allow_download
                ?
                "View + Download"
                :
                "View Only"
            }
            </td>


            <td>
                ${doc.user_download_count || 0}
                /
                ${doc.download_limit || 0}
            </td>


            <td>

                <button class="action-btn"
                onclick="previewDocument('${doc.id}')">
                    Preview
                </button>


                ${doc.allow_download
                ?
                `
                    <button class="action-btn"
                    onclick="downloadDocument('${doc.id}')">
                        Download
                    </button>
                    `
                :
                ""
            }

            </td>

        `;


        table.appendChild(row);

    });

}



async function previewDocument(documentId) {

    try {

        const response = await apiRequest(
            `/documents/${documentId}/preview`
        );

        window.open(
            response.preview_url,
            "_blank"
        );


    } catch (error) {

        alert(error.message);

    }

}



async function downloadDocument(documentId) {

    try {

        const response = await apiRequest(
            `/documents/${documentId}/download`
        );


        window.location.href =
            response.download_url;


        await loadDashboard();


    } catch (error) {

        alert(error.message);

    }

}