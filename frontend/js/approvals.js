let documentsCache = [];


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


async function loadApprovals() {
    try {
        const documents = await apiRequest("/documents");

        const pendingDocuments = documents.filter(
            doc => doc.status === "pending"
        );

        documentsCache = pendingDocuments;

        renderApprovals(pendingDocuments);

    } catch (error) {
        alert(error.message);
    }
}


function renderApprovals(documents) {

    const table = document.getElementById("approvalsTable");

    if (!table) return;

    table.innerHTML = "";


    if (!documents.length) {

        table.innerHTML = `
            <tr>
                <td colspan="5">
                    No pending documents.
                </td>
            </tr>
        `;

        return;
    }


    documents.forEach((doc) => {

        const row = document.createElement("tr");


        row.innerHTML = `

        <td>
            <strong>${doc.title || doc.original_filename || "Untitled"}</strong>
            <br>
            <small>${doc.description || doc.original_filename || ""}</small>
        </td>


        <td>
            ${doc.uploaded_by || "-"}
        </td>


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

            <button 
                class="action-btn"
                onclick="approveWithSettings('${doc.id}')">
                Approve
            </button>


            <button 
                class="action-btn reject-btn"
                onclick="rejectDocument('${doc.id}')">
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


    if (!checkbox || !limitInput) return;


    limitInput.disabled = !checkbox.checked;


    if (!checkbox.checked) {

        limitInput.value = 0;

    } else if (Number(limitInput.value) < 1) {

        limitInput.value = 1;

    }

}



async function approveWithSettings(id) {

    try {

        const confirmed = confirm(
            "Are you sure you want to approve this document?"
        );

        if (!confirmed) return;

        const checkbox = document.getElementById(`download-${id}`);

        const limitInput = document.getElementById(`limit-${id}`);


        const allowDownload = checkbox.checked;


        const downloadLimit = allowDownload
            ? parseInt(limitInput.value || 0)
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



    } catch (error) {

        alert(error.message);

    }

}

let documentPendingRejectionId = null;

function openRejectModal(id) {
    documentPendingRejectionId = id;

    const documentData = documentsCache.find((doc) => doc.id === id);

    const modal = document.getElementById("rejectModal");
    const documentName = document.getElementById("rejectDocumentName");
    const reasonInput = document.getElementById("rejectionReason");
    const reasonError = document.getElementById("rejectionReasonError");

    documentName.textContent = documentData
        ? `Reject "${documentData.original_filename || "Untitled"}"`
        : "Provide a reason for rejection.";

    reasonInput.value = "";
    reasonError.style.display = "none";
    modal.style.display = "flex";

    reasonInput.focus();
}

function closeRejectModal() {
    documentPendingRejectionId = null;

    document.getElementById("rejectModal").style.display = "none";
    document.getElementById("rejectionReason").value = "";
    document.getElementById("rejectionReasonError").style.display = "none";
}


function rejectDocument(id) {
    openRejectModal(id);
}


const searchInput = document.getElementById("searchInput");


if (searchInput) {

    searchInput.addEventListener("input", (event) => {


        const keyword = event.target.value.toLowerCase();



        const filtered = documentsCache.filter((doc) => {


            return (

                (doc.original_filename || "")
                    .toLowerCase()
                    .includes(keyword)

                ||

                (doc.uploaded_by || "")
                    .toLowerCase()
                    .includes(keyword)

                ||

                (doc.status || "")
                    .toLowerCase()
                    .includes(keyword)

            );


        });



        renderApprovals(filtered);


    });

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

const closeRejectModalButton =
    document.getElementById("closeRejectModal");

const cancelRejectButton =
    document.getElementById("cancelRejectButton");

const confirmRejectButton =
    document.getElementById("confirmRejectButton");
const rejectModal = document.getElementById("rejectModal");

if (rejectModal) {
    rejectModal.addEventListener("click", (event) => {
        if (event.target === rejectModal) {
            closeRejectModal();
        }
    });
}

document.addEventListener("keydown", (event) => {
    if (
        event.key === "Escape"
        && rejectModal
        && rejectModal.style.display === "flex"
    ) {
        closeRejectModal();
    }s
});

if (closeRejectModalButton) {
    closeRejectModalButton.addEventListener("click", closeRejectModal);
}

if (cancelRejectButton) {
    cancelRejectButton.addEventListener("click", closeRejectModal);
}

if (confirmRejectButton) {
    confirmRejectButton.addEventListener("click", async () => {
        const reasonInput =
            document.getElementById("rejectionReason");

        const reasonError =
            document.getElementById("rejectionReasonError");

        const reason = reasonInput.value.trim();

        if (!reason) {
            reasonError.style.display = "block";
            reasonInput.focus();
            return;
        }

        if (!documentPendingRejectionId) return;

        try {
            confirmRejectButton.disabled = true;
            confirmRejectButton.textContent = "Rejecting...";

            await apiRequest(
                `/documents/${documentPendingRejectionId}/reject`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        reason
                    })
                }
            );

            closeRejectModal();
            await loadApprovals();
        } catch (error) {
            alert(error.message);
        } finally {
            confirmRejectButton.disabled = false;
            confirmRejectButton.textContent = "Confirm Reject";
        }
    });
}

(async () => {

    await checkSession();

    await loadApprovals();

})();