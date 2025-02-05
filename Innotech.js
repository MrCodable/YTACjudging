const judgeName = sessionStorage.getItem("judgeName");
const GITHUB_JSON_URL = "https://raw.githubusercontent.com/MrCodable/YTACjudging/refs/heads/main/judging_data.json";
const GITHUB_USERNAME = "MrCodable";
const REPO_NAME = "YTACjudging";
const FILE_PATH = "judging_data.json";  // JSON file in repo
const GITHUB_API_URL = "https://api.github.com/repos/MrCodable/YTACjudging/contents/judging_data.json";

let judgedData = []; // Store JSON data for updating later
let timer;
let timeLeft = 600; // Default to 10 minutes (600 seconds)
let isPaused = true; // Track if timer is paused
const alarmSound = document.getElementById("alarm-sound");


// **Logout Functionality**
document.addEventListener("DOMContentLoaded", function () {
    const logoutButton = document.getElementById("logout-btn");

    if (logoutButton) {
        logoutButton.addEventListener("click", function () {
            sessionStorage.clear(); // Clear login session
            setTimeout(() => {
                window.location.href = "YTAClogin.html"; // Redirect after clearing
            }, 100); // Delay for session storage clearance
        });
    }
});

// Function to update score dynamically when slider moves
function updateScore(criteria) {
    let slider = document.getElementById(criteria);
    let scoreDisplay = document.getElementById(`${criteria}-score`);

    if (slider && scoreDisplay) {
        scoreDisplay.textContent = slider.value; // Update the span text with slider value
    }
}





// Function to update timer display
function updateTimerDisplay() {
    let minutes = Math.floor(timeLeft / 60);
    let seconds = timeLeft % 60;
    document.getElementById("timer-display").textContent = 
        `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

// Function to start or pause the timer
function toggleTimer() {
    const startButton = document.getElementById("start-timer-btn");

    if (isPaused) {
        // Start or resume countdown
        isPaused = false;
        startButton.textContent = "Pause"; // Change button text
        startButton.style.backgroundColor = "#ff4d4d"; // Change button color

        timer = setInterval(() => {
            if (timeLeft <= 0) {
                clearInterval(timer);
                startButton.textContent = "Start"; // Reset button text when time runs out
                isPaused = true;
                // **Play the alarm when time is up**
                alarmSound.play();
                startButton.textContent = "Start"; // Change button text back to "Start"
                startButton.style.backgroundColor = "#4facfe";
                return;
            }
            timeLeft--;
            updateTimerDisplay();
        }, 1000);
    } else {
        // Pause countdown
        isPaused = true;
        clearInterval(timer);
        startButton.textContent = "Start"; // Change button text back to "Start"
        startButton.style.backgroundColor = "#4facfe";
    }
}

// Function to reset the timer
function resetTimer() {
    clearInterval(timer);
    timeLeft = 600; // Reset to 10 minutes
    updateTimerDisplay();
    document.getElementById("start-timer-btn").textContent = "Start";
    document.getElementById("start-timer-btn").style.backgroundColor = "#4facfe";
}

// Function to adjust time manually (increase/decrease)
function adjustTimer(change) {
    timeLeft = Math.max(60, timeLeft + change * 60); // Prevent going below 1 min
    updateTimerDisplay();
}

// Attach event listeners to buttons
document.getElementById("start-timer-btn").addEventListener("click", toggleTimer);
document.getElementById("reset-timer-btn").addEventListener("click", resetTimer);
document.getElementById("increase-timer-btn").addEventListener("click", () => adjustTimer(1));
document.getElementById("decrease-timer-btn").addEventListener("click", () => adjustTimer(-1));

// Initialize display
updateTimerDisplay();












document.addEventListener("DOMContentLoaded", async function () {
    const teamDropdown = document.getElementById("group");
    const groupDetails = document.getElementById("group-details");

    // Ensure judge is logged in
    if (!judgeName) {
        window.location.href = "YTAClogin.html";
        return;
    }
    document.getElementById("judge-name").textContent = judgeName;

    try {
        // Fetch JSON data
        const response = await fetch(GITHUB_JSON_URL);
        const data = await response.json();
        judgedData = data.Judged_Data;

        // **Fix: Filter teams for the logged-in judge**
        const assignedTeams = judgedData.filter(team => team.Judgename === judgeName);

        console.log("Assigned teams:", assignedTeams);
        if (assignedTeams.length === 0) {
            teamDropdown.innerHTML = `<option value="">No teams assigned</option>`;
            return;
        }

        // Populate team dropdown
        teamDropdown.innerHTML = '<option value="">Please select a team</option>';
        assignedTeams.forEach(team => {
            let option = document.createElement("option");
            option.value = team.Team;
            option.textContent = team.Team;
            teamDropdown.appendChild(option);
        });

        // Listen for selection changes
        teamDropdown.addEventListener("change", function () {
            displayTeamDetails(this.value);
        });

    } catch (error) {
        console.error("Error loading JSON:", error);
        teamDropdown.innerHTML = `<option value="">Error loading teams</option>`;
    }
});

// Function to display team details based on judge and team
function displayTeamDetails(teamName) {
    const judgeName = sessionStorage.getItem("judgeName"); // Get logged-in judge name
    const team = judgedData.find(t => t.Team === teamName && t.Judgename === judgeName);

    if (!team) {
        document.getElementById("group-details").style.display = "none";
        alert("⚠ No data found for this judge and team.");
        return;
    }

    document.getElementById("members").innerHTML =
        [team.Member1, team.Member2, team.Member3]
        .filter(m => m)
        .map(m => `<li>${m.trim()}</li>`)
        .join("") || "<li>No members listed</li>";

    document.getElementById("project-name").textContent = team["Project name"] || "No project name available";

    // Update sliders and score display based on judge & team
    const criteria = {
        "OC": "Originality & Creativity",
        "UP": "Usefulness & Practicality",
        "FU": "Functionality & User-friendliness",
        "CE": "Cost - effective",
        "IM": "Impact",
        "PR": "Presentation"
    };

    Object.keys(criteria).forEach(key => {
        let score = team[criteria[key]] || 0;
        document.getElementById(key).value = score; // Update slider
        document.getElementById(`${key}-score`).textContent = score; // Update span
    });

    // Load saved comment & award for this judge & team
    document.getElementById("general-comment").value = team["Comment"] || "";
    document.getElementById("award-selection").value = team["Title"] || "";

    document.getElementById("group-details").style.display = "block";
}


// Function to submit scores, comments, and awards based on judge & team
function submitScores() {
    const selectedTeam = document.getElementById("group").value;
    const judgeName = sessionStorage.getItem("judgeName"); // Get logged-in judge

    const team = judgedData.find(t => t.Team === selectedTeam && t.Judgename === judgeName);

    if (!team) {
        alert("❌ No data found for this judge and team. Cannot submit scores.");
        return;
    }

    // Update scores
    team["Originality & Creativity"] = parseInt(document.getElementById("OC").value);
    team["Usefulness & Practicality"] = parseInt(document.getElementById("UP").value);
    team["Functionality & User-friendliness"] = parseInt(document.getElementById("FU").value);
    team["Cost - effective"] = parseInt(document.getElementById("CE").value);
    team["Impact"] = parseInt(document.getElementById("IM").value);
    team["Presentation"] = parseInt(document.getElementById("PR").value);

    // Update judge-specific comments and award
    team["Comment"] = document.getElementById("general-comment").value;
    team["Title"] = document.getElementById("award-selection").value;

    // Save updated data to GitHub JSON
    saveUpdatedScores();
}

// Ensure the submit button calls `submitScores()`
document.getElementById("submit-scores").addEventListener("click", submitScores);


// Function to update GitHub JSON
// async function saveUpdatedScores() {
//     const url = "https://api.github.com/repos/MrCodable/YTACjudging/contents/judging_data.json";

//     // **Check if JSON exists before updating**
//     const response = await fetch(url, {
//         headers: {
//             "Authorization": `token ${GITHUB_TOKEN}`,
//             "Accept": "application/vnd.github.v3+json"
//         }
//     });

//     if (!response.ok) {
//         console.error("❌ Failed to fetch JSON:", await response.text());
//         alert("❌ Error: JSON file not found. Make sure judging_data.json exists in your GitHub repository.");
//         return;
//     }

//     const fileData = await response.json();
//     const sha = fileData.sha; // Required to update the file

//     const updatedContent = btoa(unescape(encodeURIComponent(JSON.stringify({ Judged_Data: judgedData }, null, 2))));

//     const updateResponse = await fetch(url, {
//         method: "PUT",
//         headers: {
//             "Authorization": `token ${GITHUB_TOKEN}`,
//             "Accept": "application/vnd.github.v3+json",
//             "Content-Type": "application/json"
//         },
//         body: JSON.stringify({
//             message: "Updated scores, comments, and awards",
//             content: updatedContent,
//             sha: sha
//         })
//     });

//     if (updateResponse.ok) {
//         alert("✅ Scores successfully updated!");
//     } else {
//         console.error("❌ Failed to update scores:", await updateResponse.text());
//         alert("❌ Error saving scores. Try again later.");
//     }
// }

async function saveUpdatedScores() {
    const GITHUB_REPO = "MrCodable/YTACjudging";
    const GITHUB_WORKFLOW = "update-json.yml"; // Name of the GitHub Actions workflow file

    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${GITHUB_WORKFLOW}/dispatches`, {
        method: "POST",
        headers: {
            "Accept": "application/vnd.github.v3+json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            ref: "main" // Change if using a different branch
        })
    });

    if (response.ok) {
        alert("✅ Scores submitted! GitHub Actions will update the JSON file shortly.");
    } else {
        console.error("❌ Failed to trigger GitHub Actions:", await response.text());
        alert("❌ Error triggering JSON update. Try again later.");
    }
}




