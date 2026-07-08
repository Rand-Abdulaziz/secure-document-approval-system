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



async function loadNotifications() {

    const notifications =
        await apiRequest("/notifications");


    renderNotifications(notifications);

}



function renderNotifications(notifications) {


    const list =
        document.getElementById("notificationsList");


    list.innerHTML = "";



    if (!notifications.length) {


        list.innerHTML =
            `<p class="muted">No notifications yet.</p>`;


        return;

    }



    notifications.forEach((notification) => {


        const item =
            document.createElement("div");


        item.className =
            "activity-item";



        item.innerHTML = `

            <strong>
                ${notification.title || "Notification"}
            </strong>

            <p>
                ${notification.message || ""}
            </p>

        `;



        list.appendChild(item);


    });


}





const logoutButton =
    document.getElementById("logoutButton");



if (logoutButton) {


    logoutButton.addEventListener(
        "click",
        async () => {


            try {


                await apiRequest("/logout", {

                    method: "POST"

                });


                window.location.href =
                    "login.html";


            } catch(error) {


                alert(error.message);


            }


        }
    );


}





(async () => {


    await checkSession();


    await loadNotifications();


})();