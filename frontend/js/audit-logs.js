async function checkSession() {
    try {
        const session = await apiRequest("/session");

        if (!session.authenticated) {
            window.location.href = "/";
            return;
        }

        if (session.role !== "admin") {
            window.location.href = "/employee.html";
            return;
        }

    } catch (error) {
        window.location.href = "/";
    }
}
async function loadAuditLogs() {
    const logs = await apiRequest("/audit-logs");
    renderAuditLogs(logs);
}

function renderAuditLogs(logs) {
    const list = document.getElementById("auditLogsList");
    list.innerHTML = "";

    if (!logs.length) {
        list.innerHTML = `<p class="muted">No audit logs yet.</p>`;
        return;
    }

    logs.forEach((log) => {
        const item = document.createElement("div");
        item.className = "activity-item";

        item.innerHTML = `
            <strong>${log.action}</strong>
            <p>${log.details || ""} · ${log.username || "unknown"} · ${log.status}</p>
        `;

        list.appendChild(item);
    });
}

document.getElementById("logoutButton").addEventListener("click", async () => {
    await apiRequest("/logout", {
        method: "POST"
    });

    window.location.href = "/";
});

(async () => {
    await checkSession();
    await loadAuditLogs();
})();