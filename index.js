require('dotenv').config();
const conectarDB = require('./config/db');
const express = require('express');
const { google } = require('googleapis');
const cors = require("cors");
const app = express();

conectarDB();

app.use(cors());

app.use(express.json());

app.use('/DentalArce', require('./routes/routes'));

// Start the Express server
app.listen(5000, () => {
  console.log('Server running at 5000')

});