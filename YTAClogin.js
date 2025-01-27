// Constants for Google Sheets API
const SHEET_ID = '1DyIFH-sscyld-qPPxzmu-mk60jqjSm_f1PvUu4KLusM'; // Replace with your actual Spreadsheet ID
const API_KEY = 'AIzaSyDGEMucTcjrnAcBMHFhxa9YrG1WovUfONs'; // Replace with your API Key
const SHEET_NAME = 'Judges_Account';

let judgeData = [];


// Load the Google APIs client library and initialize
function handleClientLoad() {
  gapi.load('client:auth2', initClient);
}

// Initialize the API client
function initClient() {
  gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
  }).then(() => {
      loadJudgeData();
  }).catch(error => {
      console.error('Error initializing the Google Sheets API:', error);
  });
}

//Fetch valid judge codes and name from the Google Sheet
async function loadJudgeData() {
  try {
      const response = await gapi.client.sheets.spreadsheets.values.get({
          spreadsheetId: SHEET_ID,
          range: `${SHEET_NAME}!A:B`, // Columns A (Name) and B (Code)
      });

      // Extract rows from the response
      const rows = response.result.values;
      if (rows && rows.length > 0) {
          // Store data excluding the header row
          judgeData = rows.slice(1).map(row => ({ name: row[0], code: row[1] }));
      } else {
          console.error('No judge data found in the sheet.');
      }
  } catch (error) {
      console.error('Error fetching judge data:', error);
  }
}

// Handle login form submission
document.getElementById("loginForm").addEventListener("submit", async function (event) {
  event.preventDefault();

  const userCode = document.getElementById("userCode").value.trim();
  const errorMessage = document.getElementById("errorMessage");

  // Find the matching judge data
  const matchingJudge = judgeData.find(judge => judge.code === userCode);

  if (matchingJudge) {
      // Save judge name and login status in session storage
      sessionStorage.setItem("isLoggedIn", "true");
      sessionStorage.setItem("judgeName", matchingJudge.name); // Save judge's name

      // Redirect to the judging page
      history.replaceState(null, null, "Innotech.html");
      window.location.href = "Innotech.html";
  } else {
      // Show error message
      errorMessage.textContent = "Invalid user code. Please try again.";
      errorMessage.style.display = "block";
  }
});

// Load the API client on DOM content load
document.addEventListener('DOMContentLoaded', () => {
  handleClientLoad();
});