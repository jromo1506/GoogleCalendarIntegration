
const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.SECRET_ID,
  process.env.REDIRECT
);

// Pre-configured Calendar service
const calendarService = google.calendar({ version: 'v3', auth: oauth2Client });

module.exports = { oauth2Client, calendarService };