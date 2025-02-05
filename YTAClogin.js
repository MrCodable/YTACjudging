const GITHUB_JSON_URL = "https://raw.githubusercontent.com/MrCodable/YTACjudging/refs/heads/main/Judges_account.json";

if (sessionStorage.getItem("judgeName")) {
    window.location.href = "Innotech.html";
}

document.getElementById("loginForm").addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevent form from reloading

    const userCode = document.getElementById("userCode").value.trim();
    const errorMessage = document.getElementById("errorMessage");

    if (!userCode) {
        errorMessage.textContent = "❌ Please enter your Judge Code.";
        return;
    }

    try {
        // Fetch JSON from GitHub
        const response = await fetch(GITHUB_JSON_URL);
        if (!response.ok) throw new Error("Failed to fetch JSON file");

        const data = await response.json();
        
        // **Ensure JSON is properly loaded**
        if (!data || !data.Judges_Account) {
            throw new Error("Invalid JSON structure: Judges_Account is missing.");
        }

        // Search for the judge's user code
        const judge = data.Judges_Account.find(j => j.usercode === userCode);

        if (judge) {
            sessionStorage.setItem("judgeName", judge.Judgename); // Store judge name
            window.location.href = "Innotech.html"; // Redirect to judging page
        } else {
            errorMessage.textContent = "❌ Invalid Judge Code. Please try again.";
        }
    } catch (error) {
        console.error("Error loading JSON:", error);
        errorMessage.textContent = "❌ Error connecting to the database. Try again later.";
    }
});


// Disable back button navigation
window.history.pushState(null, "", window.location.href);
window.addEventListener("popstate", function () {
    window.history.pushState(null, "", window.location.href);
});