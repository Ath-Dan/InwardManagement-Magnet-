// backend/src/utils/googleSheets.js
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Define the scopes for Google Sheets API
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// Define a temporary file path to store the decoded credentials
const TEMP_CREDENTIALS_PATH = path.join(__dirname, '../temp_credentials.json');

// Function to decode and write credentials from Base64 to a temporary file
function decodeCredentials() {
  const base64Credentials = process.env.CREDENTIALS_BASE64;

  if (!base64Credentials) {
    throw new Error('CREDENTIALS_BASE64 environment variable is not set');
  }

  fs.writeFileSync(TEMP_CREDENTIALS_PATH, Buffer.from(base64Credentials, 'base64'));
  return TEMP_CREDENTIALS_PATH;
}

// Initialize and return the Google Sheets API client
async function getSheets() {
  try {
    // Decode credentials and get the path to the temporary file
    const credentialsPath = decodeCredentials();

    // Create the auth object
    const auth = new google.auth.GoogleAuth({
      keyFile: credentialsPath,
      scopes: SCOPES,
    });

    // Get the authenticated client
    const client = await auth.getClient();

    // Return the Google Sheets API client
    return google.sheets({ version: 'v4', auth: client });
  } catch (error) {
    console.error('Error initializing Google Sheets:', error);
    throw new Error('Failed to initialize Google Sheets');
  } finally {
    // Clean up the temporary credentials file
    if (fs.existsSync(TEMP_CREDENTIALS_PATH)) {
      fs.unlinkSync(TEMP_CREDENTIALS_PATH);
    }
  }
}

module.exports = { getSheets };
