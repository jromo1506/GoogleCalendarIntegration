require('dotenv').config();
const cron = require('node-cron');
const conectarDB = require('./config/db');
const express = require('express');
const cors = require("cors");
const app = express();

// Jobs
const checkBirthdays = require('./jobs/birthdayCron');
const checkAppointments = require('./jobs/citaCron');

// Configuración inicial
conectarDB();
app.use(cors());
app.use(express.json());

// Rutas
app.use('/DentalArce', require('./routes/routes'));
const webhookRouter = require('./routes/webhook')
app.use('/webhook', webhookRouter);

// Programación de tareas
const cronOptions = {
    timezone: "America/Mexico_City"
};

// Cumpleaños a las 9 AM
cron.schedule('0 9 * * *', () => {
    console.log('Verificando cumpleaños...');
    checkBirthdays();
}, cronOptions);

// Recordatorios cada hora
cron.schedule('* * * * *', () => {
    console.log('Verificando recordatorios de citas...');
    checkAppointments();
}, cronOptions);

// Endpoint de salud
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
});


// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running at ${PORT}`);
});