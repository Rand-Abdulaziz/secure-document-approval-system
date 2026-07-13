const API_BASE_URL =
    "https://securedoc-backend-364825858975.us-east1.run.app/api";


async function apiRequest(endpoint, options = {}) {

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {

        credentials: "include",

        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        },

        ...options
    });


    const data = await response.json();


    if (!response.ok) {
        throw new Error(data.message || "Request failed");
    }


    return data;
}