async function checkSession() {
    try {
        const session = await apiRequest("/session");

        if (!session.authenticated) {
            window.location.href = "login.html";
            return;
        }

        if (session.role !== "employee") {
            window.location.href = "admin.html";
            return;
        }

    } catch (error) {
        window.location.href = "login.html";
    }
}


async function loadNotifications() {
    try {
        const notifications = await apiRequest("/notifications");

        renderNotifications(notifications);

    } catch (error) {
        alert(error.message);
    }
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
        list.innerHTML = `
            <p class="muted">
                No notifications yet.
            </p>
        `;

        return;
    }

    notifications.forEach((notification) => {
        const item = document.createElement("div");

        item.className = notification.is_read
            ? "activity-item notification-read"
            : "activity-item notification-unread";

        item.innerHTML = `
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

            ${
                notification.is_read
                    ? ""
                    : `
                        <button
                            class="action-btn"
                            onclick="markNotificationAsRead('${notification.id}')"
                        >
                            Mark as read
                        </button>
                    `
            }
        `;

        list.appendChild(item);
    });
}


async function markNotificationAsRead(notificationId) {
    try {
        await apiRequest(
            `/notifications/${notificationId}/read`,
            {
                method: "POST"
            }
        );

        await loadNotifications();

    } catch (error) {
        alert(error.message);
    }
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
    await loadNotifications();
})();
