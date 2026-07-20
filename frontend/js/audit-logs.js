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


async function loadAuditLogs() {
    try {
        const logs = await apiRequest("/audit-logs");

        renderAuditLogs(logs);

    } catch (error) {
        alert(error.message);
    }
}


function formatAuditDate(createdAt) {
    if (!createdAt) {
        return "Date unavailable";
    }

    const date = new Date(createdAt);

    if (Number.isNaN(date.getTime())) {
        return "Date unavailable";
    }

    return date.toLocaleString();
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

    logs.forEach((log) => {
        const item = document.createElement("div");

        item.className = "activity-item";

        item.innerHTML = `
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
                    IP: ${log.ip_address || "Unavailable"}
                </span>

                <span>
                    ${formatAuditDate(log.created_at)}
                </span>
            </div>
        `;

        list.appendChild(item);
    });
}


const logoutButton =
    document.getElementById("logoutButton");


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
    await loadAuditLogs();
})();
