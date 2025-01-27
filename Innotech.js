// Constants for Google Sheets API
const SHEET_ID = '1DyIFH-sscyld-qPPxzmu-mk60jqjSm_f1PvUu4KLusM'; // Replace with your actual Spreadsheet ID
const API_KEY = 'AIzaSyDGEMucTcjrnAcBMHFhxa9YrG1WovUfONs'; // Replace with your API Key
const SHEET_NAME = 'Judged_Data';

let judgeName = sessionStorage.getItem("judgeName"); // Get judge's name from sessionStorage
let groupsData = []; // To store group data

// Load the Google APIs client library and initialize
function handleClientLoad() {
    gapi.load("client:auth2", initClient);
}

// Initialize the API client
function initClient() {
    gapi.client.init({
        apiKey: API_KEY, // Still needed for some features like Sheets API discovery.
        clientId: "258146943914-olah33qa2gcut8vfbc7ijnbho46sqdcf.apps.googleusercontent.com", // Replace with your OAuth Client ID.
        discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
        scope: "https://www.googleapis.com/auth/spreadsheets",
    }).then(() => {
        gapi.auth2.getAuthInstance().signIn().then(() => {
            console.log("Signed in successfully.");
        });
    }).catch(error => {
        console.error("Error initializing API client:", error);
    });
}

function initializeAuth() {
    const client = google.accounts.oauth2.initTokenClient({
        client_id: '258146943914-olah33qa2gcut8vfbc7ijnbho46sqdcf.apps.googleusercontent.com', // Replace with your Client ID
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        callback: (response) => {
            if (response.access_token) {
                console.log('Access token received:', response.access_token);
                loadGroups(response.access_token); // Pass the access token to your app logic
            } else {
                console.error('Failed to get access token');
            }
        },
    });

    // Trigger the authentication flow
    client.requestAccessToken();
}

// Fetch groups data from Google Sheets
async function loadGroups(accessToken) {
    const groupSelect = document.getElementById('group');
    try {
        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}!A:L`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        const data = await response.json();
        const rows = data.values;
        if (rows && rows.length > 0) {
            groupsData = rows.slice(1).map(row => ({
                judge: row[0],
                group: row[1],
                members: row.slice(2, 5),
                project: row[5],
                scoresGiven: row[6] !== undefined && row[6] !== "",
            }));

            groupsData.forEach(data => {
                if (data.judge === judgeName) {
                    const option = document.createElement('option');
                    option.value = data.group;
                    option.textContent = data.group;
                    if (data.scoresGiven) option.style.color = "red";
                    groupSelect.appendChild(option);
                }
            });
        }
    } catch (error) {
        console.error("Error loading group data:", error);
    }
}

// Update group details dynamically based on the selected group
async function updateGroupDetails() {
    const groupSelect = document.getElementById('group');
    const groupDetails = document.getElementById('group-details');
    const selectedGroup = groupSelect.value;

    if (!selectedGroup) {
        groupDetails.style.display = 'none';
        return;
    }

    // Find the selected group's data
    const groupData = groupsData.find(data => data.group === selectedGroup && data.judge === judgeName);

    if (groupData) {
        // Populate members and project name
        document.getElementById('members').innerHTML = groupData.members
            .filter(member => member) // Exclude empty member cells
            .map(member => `<li>${member}</li>`)
            .join('');
        document.getElementById('project-name').textContent = groupData.project;

        // Display group details
        groupDetails.style.display = 'block';

        // Fetch and preload the scores
        try {
            const range = `${SHEET_NAME}!G${groupsData.indexOf(groupData) + 2}:L${groupsData.indexOf(groupData) + 2}`;
            const response = await gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: SHEET_ID,
                range: range,
            });

            if (response.result.values && response.result.values[0]) {
                const scores = response.result.values[0];
                const isNonZero = scores.some(score => parseInt(score) > 0);

                document.getElementById('OC').value = scores[0] || 0;
                document.getElementById('UP').value = scores[1] || 0;
                document.getElementById('FUF').value = scores[2] || 0;
                document.getElementById('CE').value = scores[3] || 0;
                document.getElementById('IMP').value = scores[4] || 0;
                document.getElementById('PST').value = scores[5] || 0;

                // Update score displays
                updateScore('OC');
                updateScore('UP');
                updateScore('FUF');
                updateScore('CE');
                updateScore('IMP');
                updateScore('PST');

                // Update the submit button
                const submitBtn = document.querySelector('.submit-btn');
                if (isNonZero) {
                    submitBtn.style.backgroundColor = 'red';
                    submitBtn.textContent = 'Update Scores';
                } else {
                    submitBtn.style.backgroundColor = '#4facfe';
                    submitBtn.textContent = 'Submit Scores';
                }


            } else {
                console.log('No scores found for this group and judge.');
            }
        } catch (error) {
            console.error('Error fetching scores:', error);
        }
    } else {
        groupDetails.style.display = 'none';
        alert('No data found for the selected group and judge.');
    }
}


// Submit scores to Google Sheets
async function submitScores() {
    if (!gapi.client || !gapi.client.sheets) {
        alert("Google Sheets API is not initialized. Please try again.");
        return;
    }

    const groupSelect = document.getElementById("group");
    const selectedGroup = groupSelect.value;

    if (!selectedGroup) {
        alert("Please select a group before submitting scores.");
        return;
    }

    const scores = {
        OC: document.getElementById("OC").value,
        UP: document.getElementById("UP").value,
        FUF: document.getElementById("FUF").value,
        CE: document.getElementById("CE").value,
        IMP: document.getElementById("IMP").value,
        PST: document.getElementById("PST").value,
    };
    

    // Find the row that matches the selected group and judge's name
    const rowIndex = groupsData.findIndex(
        data => data.group === selectedGroup && data.judge === judgeName
    ) + 2; // +2 accounts for the header row and 1-based index

    if (rowIndex < 2) {
        alert("Could not find the selected group and judge in the spreadsheet.");
        return;
    }

    try {
        const range = `${SHEET_NAME}!G${rowIndex}:L${rowIndex}`; // Update only the score columns
        const body = {
            values: [
                [
                    scores.OC, // Column G
                    scores.UP, // Column H
                    scores.FUF, // Column I
                    scores.CE, // Column J
                    scores.IMP, // Column K
                    scores.PST, // Column L
                ],
            ],
        };

        const response = await gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: SHEET_ID,
            range: range,
            valueInputOption: "USER_ENTERED",
            resource: body,
        });

        if (response.status === 200) {
            // Show success modal
            showModal(`Scores submitted successfully for team: ${selectedGroup}`, {
                scores: scores,
            });
        
            const groupOption = [...groupSelect.options].find(
                (option) => option.value === selectedGroup
            );
            if (groupOption) {
                groupOption.style.color = "red";
            }
        } else {
            throw new Error(`Failed to update scores: ${response.statusText}`);
        }
        
    } catch (error) {
        console.error("Error updating scores:", error);
        alert("Failed to update scores. Please try again.");
    }
}


function showModal(title, message) {
    const modal = document.getElementById("success-modal");
    const messageContent = `
        <strong>${title}</strong><br>
        <ul>
            <li><strong>Originality & Creativity:</strong> ${message.scores.OC}</li>
            <li><strong>Usefulness & Practicality:</strong> ${message.scores.UP}</li>
            <li><strong>Functionality & User-friendliness:</strong> ${message.scores.FUF}</li>
            <li><strong>Cost-effectiveness:</strong> ${message.scores.CE}</li>
            <li><strong>Impact:</strong> ${message.scores.IMP}</li>
            <li><strong>Presentation:</strong> ${message.scores.PST}</li>
        </ul>
    `;
    document.getElementById("success-message").innerHTML = messageContent;
    modal.style.display = "flex";
}


function closeModal() {
    document.getElementById("success-modal").style.display = "none";
    
    // Reset the group selection dropdown to the default state
    const groupSelect = document.getElementById("group");
    groupSelect.value = ""; // Set to the default option's value (usually empty)

    // Hide group details section
    const groupDetails = document.getElementById("group-details");
    groupDetails.style.display = "none";
}

// Update score sliders dynamically
function updateScore(id) {
    document.getElementById(`${id}-score`).textContent = document.getElementById(id).value;
}


function logout() {
    sessionStorage.removeItem("isLoggedIn");
    window.location.href = "index.html";
}

let timerInterval;
let remainingTime = 10*60; // Time in seconds

function startTimer() {
    const duration = remainingTime; // 5 minutes in seconds (set your desired time)
    remainingTime = duration;
    updateTimerDisplay();

    const startBtn = document.getElementById("start-timer-btn");
    startBtn.disabled = true; // Disable start button during countdown

    timerInterval = setInterval(() => {
        remainingTime -= 1;
        updateTimerDisplay();

        if (remainingTime <= 0) {
            clearInterval(timerInterval);
            playAlarm();
            startBtn.disabled = false; // Re-enable start button
        }
    }, 1000); // Update every second
}

function resetTimer() {
    clearInterval(timerInterval);
    remainingTime = 10*60;
    updateTimerDisplay();
    document.getElementById("start-timer-btn").disabled = false;
}

function updateTimerDisplay() {
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    document.getElementById("timer-display").textContent =
        `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function playAlarm() {
    const alarm = document.getElementById("alarm-sound");
    alarm.play();
}


// Load the API client on DOM content load
document.addEventListener('DOMContentLoaded', () => {
    handleClientLoad();
    initializeAuth();
    document.getElementById('group').addEventListener('change', updateGroupDetails);
});

