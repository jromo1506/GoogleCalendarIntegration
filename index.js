require('dotenv').config();
const conectarDB = require('./config/db');
const express = require('express');
const { google } = require('googleapis');


// Initialize Express app
const app = express();
conectarDB();
app.use(express.json());
app.use('/DentalArce', require('./routes/routes'));




// Start the Express server
app.listen(3000, () => {
  console.log('Server running at 3000')

});