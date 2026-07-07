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

async function loadDocuments() {
    const documents = await apiRequest("/documents");
    documentsCache = documents;
    renderDocuments(documents);
}

function renderDocuments(documents) {
    const table = document.getElementById("documentsTable");
    table.innerHTML = "";

    documents.forEach((doc) => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${doc.original_filename || "Untitled"}</td>
            <td>${doc.uploaded_by || "-"}</td>
            <td><span class="badge ${doc.status}">${doc.status}</span></td>
            <td>${doc.download_count || 0} / ${doc.download_limit || 0}</td>
            <td>
                ${doc.status === "pending" ? `
                    <button class="action-btn" onclick="approveDocument('${doc.id}')">Approve</button>
                    <button class="action-btn reject-btn" onclick="rejectDocument('${doc.id}')">Reject</button>
                ` : "-"}
            </td>
        `;

        table.appendChild(row);
    });
}

async function approveDocument(id) {
    await apiRequest(`/documents/${id}/approve`, {
        method: "POST"
    });

    await loadDocuments();
}

async function rejectDocument(id) {
    const reason = prompt("Reason for rejection:");

    await apiRequest(`/documents/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({
            reason: reason || "No reason provided"
        })
    });

    await loadDocuments();
}

document.getElementById("searchInput").addEventListener("input", (event) => {
    const keyword = event.target.value.toLowerCase();

    const filtered = documentsCache.filter((doc) =>
        (doc.original_filename || "").toLowerCase().includes(keyword) ||
        (doc.uploaded_by || "").toLowerCase().includes(keyword) ||
        (doc.status || "").toLowerCase().includes(keyword)
    );

    renderDocuments(filtered);
});

document.getElementById("logoutButton").addEventListener("click", async () => {
    await apiRequest("/logout", {
        method: "POST"
    });

    window.location.href = "/";
});

(async () => {
    await checkSession();
    await loadDocuments();
})();