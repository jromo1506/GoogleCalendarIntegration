const { oauth2Client, calendarService } = require('../services/googleAuthService');




exports.auth =  (req, res) => {
  // Generate the Google authentication URL
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Request offline access to receive a refresh token
    scope: 'https://www.googleapis.com/auth/calendar.readonly' // Scope for read-only access to the calendar
  });
  // Redirect the user to Google's OAuth 2.0 server
  res.redirect(url);
}



exports.authRedirect = (req, res) => {
  const code = req.query.code;
  oauth2Client.getToken(code, (err, tokens) => {
    if (err) {
      console.error('Error exchanging code for tokens:', err);
      res.status(500).send('Error');
      return;
    }
    oauth2Client.setCredentials(tokens);
    res.send('Successfully logged in');
  });
};
// Route to list all calendars
exports.listCalendars = (req, res) => {
  calendarService.calendarList.list({}, (err, response) => {
    if (err) {
      console.error('Error fetching calendars:', err);
      res.status(500).send('Error');
      return;
    }
    res.json(response.data.items);
  });
};







// Route to handle redirect and token exchange
exports.authRedirect = (req, res) => {
  const code = req.query.code;
  oauth2Client.getToken(code, (err, tokens) => {
    if (err) {
      console.error('Error exchanging code for tokens:', err);
      res.status(500).send('Error');
      return;
    }
    oauth2Client.setCredentials(tokens);
    res.send('Successfully logged in');
  });
};
// Route to list all calendars
exports.listCalendars = (req, res) => {
  calendarService.calendarList.list({}, (err, response) => {
    if (err) {
      console.error('Error fetching calendars:', err);
      res.status(500).send('Error');
      return;
    }
    res.json(response.data.items);
  });
};

// Route to list events from a specified calendar
exports.listEvents = (req, res) => {
  const calendarId = req.query.calendarId || 'primary';
  calendarService.events.list(
    {
      calendarId,
      timeMin: new Date().toISOString(),
      maxResults: 15,
      singleEvents: true,
      orderBy: 'startTime',
    },
    (err, response) => {
      if (err) {
        console.error('Error fetching events:', err);
        res.status(500).send('Error');
        return;
      }
      res.json(response.data.items);
    }
  );
};
