require('dotenv').config();
const conectarDB = require('./config/db');
const express = require('express');
const { google } = require('googleapis');
const cors = require("cors");
const app = express();
const vinculosJob = require('./jobs/vinculosCron');

conectarDB();

app.use(cors());

app.use(express.json());

app.use('/DentalArce', require('./routes/routes'));

vinculosJob();

// Start the Express server
app.listen(5000, () => {
  console.log('Server running at 5000')

});