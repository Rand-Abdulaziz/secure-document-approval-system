const loginForm = document.getElementById("loginForm");
const message = document.getElementById("message");
const loginButton = document.getElementById("loginButton");

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    message.textContent = "";
    loginButton.textContent = "Signing in...";
    loginButton.disabled = true;

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    try {
        const data = await apiRequest("/login", {
            method: "POST",
            body: JSON.stringify({ username, password })
        });

        if (data.role === "admin") {
            window.location.href = "admin.html";
        } else {
            window.location.href = "employee.html";
        }
    } catch (error) {
        message.textContent = error.message;
    } finally {
        loginButton.textContent = "Sign In";
        loginButton.disabled = false;
    }
});