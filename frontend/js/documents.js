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
                ${doc.user_download_count || 0}
                /
                ${doc.download_limit || 0}
            </td>


            <td>

                ${
                doc.status === "pending"

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


        await apiRequest(`/documents/${id}/approve`, {

            method: "POST"

        });



        await loadDocuments();



    } catch (error) {


        alert(error.message);


    }

}




async function rejectDocument(id) {


    try {


        const reason = prompt("Reason for rejection:");



        await apiRequest(`/documents/${id}/reject`, {

            method: "POST",

            body: JSON.stringify({

                reason: reason || "No reason provided"

            })

        });



        await loadDocuments();



    } catch (error) {


        alert(error.message);


    }

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





(async () => {


    await checkSession();

    await loadDocuments();


})();