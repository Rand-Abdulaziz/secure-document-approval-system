let currentUser = null;


async function checkSession() {

    try {

        const session = await apiRequest("/session");


        if (!session.authenticated) {

            window.location.href = "login.html";
            return;

        }


        currentUser = session.username;


        if (session.role !== "employee") {

            window.location.href = "admin.html";
            return;

        }


    } catch (error) {

        window.location.href = "login.html";

    }

}



async function loadEmployeeDashboard() {

    const documents = await apiRequest("/documents");


    const myDocuments = documents.filter(
        doc => doc.uploaded_by === currentUser
    );


    renderStats(myDocuments);
    renderDocuments(myDocuments);


    const sharedDocuments = documents.filter(
        doc => doc.status === "approved"
    );


    renderSharedDocuments(sharedDocuments);

}



function renderSharedDocuments(documents) {

    const table = document.getElementById("sharedDocumentsTable");

    table.innerHTML = "";


    if (!documents.length) {

        table.innerHTML = `
            <tr>
                <td colspan="5">
                    No shared documents available.
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
                <small>${doc.description || ""}</small>
            </td>


            <td>
                ${doc.uploaded_by || "-"}
            </td>


            <td>

                <span class="badge ${doc.allow_download ? "approved" : "pending"}">

                    ${doc.allow_download 
                    ? "View + Download" 
                    : "View Only"}

                </span>

            </td>


            <td>

                ${doc.download_count || 0}
                /
                ${doc.download_limit || 0}

            </td>


            <td>

                <button class="action-btn"
                    onclick="previewDocument('${doc.id}')">
                    Preview
                </button>


                ${
                doc.allow_download

                ? `
                <button class="download-btn"
                    onclick="downloadDocument('${doc.id}')">
                    Download
                </button>
                `

                : ""

                }

            </td>

        `;


        table.appendChild(row);


    });

}



function renderStats(documents) {

    document.getElementById("totalDocs").textContent =
        documents.length;


    document.getElementById("pendingDocs").textContent =
        documents.filter(
            d => d.status === "pending"
        ).length;


    document.getElementById("approvedDocs").textContent =
        documents.filter(
            d => d.status === "approved"
        ).length;


    document.getElementById("rejectedDocs").textContent =
        documents.filter(
            d => d.status === "rejected"
        ).length;

}




function renderDocuments(documents) {


    const table =
        document.getElementById("employeeDocumentsTable");


    table.innerHTML = "";


    if (!documents.length) {

        table.innerHTML = `

            <tr>
                <td colspan="4">
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

            <strong>
            ${doc.title || doc.original_filename || "Untitled"}
            </strong>

            <br>

            <small>
            ${doc.description || ""}
            </small>

        </td>



        <td>

            <span class="badge ${doc.status}">
                ${doc.status}
            </span>

        </td>



        <td>

            ${doc.download_count || 0}
            /
            ${doc.download_limit || 0}

        </td>



        <td>


            <button class="preview-btn"
                onclick="previewDocument('${doc.id}')">

                Preview

            </button>



            ${
            doc.allow_download

            ? `

            <button class="download-btn"
                onclick="downloadDocument('${doc.id}')">

                Download

            </button>

            `

            : ""

            }


        </td>


        `;


        table.appendChild(row);


    });


}




const logoutButton =
    document.getElementById("logoutButton");



if (logoutButton) {


    logoutButton.addEventListener("click", async () => {


        await apiRequest("/logout", {

            method: "POST"

        });


        window.location.href = "login.html";


    });


}





(async () => {


    await checkSession();


    await loadEmployeeDashboard();


})();





const uploadButton =
    document.getElementById("uploadButton");



if (uploadButton) {


    uploadButton.onclick = () => {

        document.getElementById("uploadModal").style.display = "flex";

    };

}





const closeUploadModal =
    document.getElementById("closeUploadModal");



if (closeUploadModal) {


    closeUploadModal.onclick = () => {

        document.getElementById("uploadModal").style.display = "none";

    };


}





const allowDownload =
    document.getElementById("allowDownload");



if (allowDownload) {


    allowDownload.addEventListener("change", (e) => {


        document.getElementById("downloadLimitContainer").style.display =

            e.target.checked

            ? "block"

            : "none";


    });


}




const submitUpload =
    document.getElementById("submitUpload");



if (submitUpload) {


    submitUpload.addEventListener(
        "click",
        uploadDocument
    );


}





async function uploadDocument() {


    const title =
        document.getElementById("documentTitle").value;


    const description =
        document.getElementById("documentDescription").value;


    const file =
        document.getElementById("documentFile").files[0];


    const allowDownload =
        document.getElementById("allowDownload").checked;



    const downloadLimit = allowDownload

        ? parseInt(
            document.getElementById("downloadLimit").value
        )

        : 0;



    if (!file) {

        alert("Please select a file.");

        return;

    }



    const formData = new FormData();


    formData.append("title", title);

    formData.append("description", description);

    formData.append("file", file);

    formData.append(
        "allow_download",
        allowDownload
    );

    formData.append(
        "download_limit",
        downloadLimit
    );




    const response = await fetch(
        `${API_BASE_URL}/documents`,
        {

            method: "POST",

            credentials: "include",

            body: formData

        }
    );



    if (!response.ok) {


        const error =
            await response.json();


        alert(
            error.message || "Upload failed."
        );


        return;

    }




    alert(
        "Document submitted for approval."
    );



    document.getElementById("uploadModal").style.display =
        "none";



    await loadEmployeeDashboard();


}





async function previewDocument(documentId) {


    try {


        const response =
            await apiRequest(
                `/documents/${documentId}/preview`
            );



        window.open(
            response.preview_url,
            "_blank"
        );


    } catch(error) {


        alert(error.message);


    }


}





async function downloadDocument(documentId) {


    try {


        const response =
            await apiRequest(
                `/documents/${documentId}/download`
            );



        window.location.href =
            response.download_url;



        await loadEmployeeDashboard();



    } catch(error) {


        alert(error.message);


    }


}