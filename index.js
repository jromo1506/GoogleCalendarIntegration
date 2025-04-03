require('dotenv').config();
const cron = require('node-cron');
const conectarDB = require('./config/db');
const express = require('express');
const { google } = require('googleapis');
const cors = require("cors");
const app = express();
const enviarFelicitacion = require ('./services/plantillasService');
const vinculosJob = require('./jobs/vinculosCron');
const enviarPlantilla = require('./jobs/plantillas'); // Importar la función
const checkBirthdays = require('./jobs/birthdayCron'); // Importar el nuevo job

conectarDB();

app.use(cors());

app.use(express.json());

app.use('/DentalArce', require('./routes/routes'));

// vinculosJob();

// cron.schedule('* * * * *', () => {
//   console.log('Enviando mensaje de plantilla...');
//   enviarPlantilla(); // Llamar a la función
// });

// verificación de cumpleaños diariamente a las 9 AM
cron.schedule('0 9 * * *', () => {
  console.log('Verificando cumpleaños...');
  checkBirthdays();
}, {
  timezone: "America/Mexico_City" // Ajusta la zona horaria según necesites
});


// Start the Express server
app.listen(5000, () => {
  console.log('Server running at 5000')

});