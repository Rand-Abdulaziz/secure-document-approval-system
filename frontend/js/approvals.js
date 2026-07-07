let documentsCache = [];

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

async function loadApprovals() {
    const documents = await apiRequest("/documents");

    const pendingDocuments = documents.filter(
        doc => doc.status === "pending"
    );

    documentsCache = pendingDocuments;
    renderApprovals(pendingDocuments);
}

function renderApprovals(documents) {
    const table = document.getElementById("approvalsTable");
    table.innerHTML = "";

    documents.forEach((doc) => {
        const row = document.createElement("tr");

        row.innerHTML = `
    <td>
        <strong>${doc.title || doc.original_filename || "Untitled"}</strong><br>
        <small>${doc.description || doc.original_filename || ""}</small>
    </td>

    <td>${doc.uploaded_by || "-"}</td>

    <td>
        <label class="checkbox-row">
            <input
                type="checkbox"
                id="download-${doc.id}"
                ${doc.allow_download ? "checked" : ""}
                onchange="toggleDownloadLimit('${doc.id}')"
            >
            Allow download
        </label>
    </td>

    <td>
        <input
            class="small-input"
            type="number"
            id="limit-${doc.id}"
            min="0"
            value="${doc.download_limit || 0}"
            ${doc.allow_download ? "" : "disabled"}
        >
    </td>

    <td>
        <button class="action-btn" onclick="approveWithSettings('${doc.id}')">
            Approve
        </button>

        <button class="action-btn reject-btn" onclick="rejectDocument('${doc.id}')">
            Reject
        </button>
    </td>
`;

        table.appendChild(row);
    });
}

function toggleDownloadLimit(id) {
    const checkbox = document.getElementById(`download-${id}`);
    const limitInput = document.getElementById(`limit-${id}`);

    limitInput.disabled = !checkbox.checked;

    if (!checkbox.checked) {
        limitInput.value = 0;
    } else if (Number(limitInput.value) < 1) {
        limitInput.value = 1;
    }
}

async function approveWithSettings(id) {
    const allowDownload = document.getElementById(`download-${id}`).checked;
    const downloadLimit = allowDownload
        ? parseInt(document.getElementById(`limit-${id}`).value)
        : 0;

    await apiRequest(`/documents/${id}/settings`, {
        method: "PATCH",
        body: JSON.stringify({
            allow_download: allowDownload,
            download_limit: downloadLimit
        })
    });

    await apiRequest(`/documents/${id}/approve`, {
        method: "POST"
    });

    await loadApprovals();
}

async function rejectDocument(id) {
    const reason = prompt("Reason for rejection:");

    await apiRequest(`/documents/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({
            reason: reason || "No reason provided"
        })
    });

    await loadApprovals();
}

document.getElementById("searchInput").addEventListener("input", (event) => {
    const keyword = event.target.value.toLowerCase();

    const filtered = documentsCache.filter((doc) =>
        (doc.original_filename || "").toLowerCase().includes(keyword) ||
        (doc.uploaded_by || "").toLowerCase().includes(keyword) ||
        (doc.status || "").toLowerCase().includes(keyword)
    );

    renderApprovals(filtered);
});

document.getElementById("logoutButton").addEventListener("click", async () => {
    await apiRequest("/logout", {
        method: "POST"
    });

    window.location.href = "/";
});

(async () => {
    await checkSession();
    await loadApprovals();
})();