require('dotenv').config();

// Import required modules
const express = require('express');
const { google } = require('googleapis');

// Initialize Express app
const app = express();


app.use('/DentalArce', require('./routes/routes'));




// Start the Express server
app.listen(3000, () => {
  console.log('Server running at 3000')

});