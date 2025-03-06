require('dotenv').config();
const cron = require('node-cron');
const conectarDB = require('./config/db');
const express = require('express');
const { google } = require('googleapis');
const cors = require("cors");
const app = express();
const vinculosJob = require('./jobs/vinculosCron');
// const sendTemplateMessage = require('./jobs/plantillas');
conectarDB();

app.use(cors());

app.use(express.json());

app.use('/DentalArce', require('./routes/routes'));

vinculosJob();
// cron.schedule('* * * * *', () => {
//   console.log('Enviando mensaje de plantilla...');
//   sendTemplateMessage();
// });

// Start the Express server
app.listen(5000, () => {
  console.log('Server running at 5000')

});