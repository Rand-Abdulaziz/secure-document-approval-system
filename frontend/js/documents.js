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



async function loadDocuments() {

    try {

        const documents = await apiRequest("/documents");

        documentsCache = documents;

        renderDocuments(documents);


    } catch (error) {

        alert(error.message);

    }

}




function renderDocuments(documents) {


    const table = document.getElementById("documentsTable");


    if (!table) return;


    table.innerHTML = "";



    if (!documents.length) {

        table.innerHTML = `
            <tr>
                <td colspan="5">
                    No documents found.
                </td>
            </tr>
        `;

        return;

    }



    documents.forEach((doc) => {


        const row = document.createElement("tr");



        row.innerHTML = `

            <td>
                ${doc.original_filename || "Untitled"}
            </td>


            <td>
                ${doc.uploaded_by || "-"}
            </td>


            <td>
                <span class="badge ${doc.status}">
                    ${doc.status}
                </span>
            </td>


            <td>
                ${doc.allow_download ? `${doc.user_download_count || 0} / ${doc.download_limit || 0}` : "View Only"}
            </td>


            <td>

                ${doc.status === "pending"

                ?

                `
                <button 
                    class="action-btn"
                    onclick="approveDocument('${doc.id}')">
                    Approve
                </button>


                <button 
                    class="action-btn reject-btn"
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




async function approveDocument(id) {


    try {

        const confirmed = confirm("Are you sure you want to approve this document?");

        if (!confirmed) return;


        await apiRequest(`/documents/${id}/approve`, {

            method: "POST"

        });



        await loadDocuments();



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



        renderDocuments(filtered);


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
            await loadDocuments();
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

    await loadDocuments();


})();