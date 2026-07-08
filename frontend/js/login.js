const loginForm = document.getElementById("loginForm");
const message = document.getElementById("message");
const loginButton = document.getElementById("loginButton");


if (loginForm) {


    loginForm.addEventListener("submit", async (event) => {


        event.preventDefault();


        message.textContent = "";


        loginButton.textContent = "Signing in...";
        loginButton.disabled = true;



        const username =
            document.getElementById("username").value.trim();


        const password =
            document.getElementById("password").value;



        try {


            const data = await apiRequest("/login", {

                method: "POST",

                body: JSON.stringify({

                    username,

                    password

                })

            });



            if (data.role === "admin") {


                window.location.href = "admin.html";


            } else if (data.role === "employee") {


                window.location.href = "employee.html";


            } else {


                throw new Error("Invalid user role");

            }



        } catch (error) {


            message.textContent =
                error.message || "Login failed";


        } finally {


            loginButton.textContent = "Sign In";

            loginButton.disabled = false;


        }


    });


}