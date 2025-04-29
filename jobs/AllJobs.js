const cron = require('node-cron');
const checkBirthdays = require('./birthdayCron');
const checkAppointments = require('./citaCron');

const AllJobs = async () => {
    // Opciones de zona horaria
    const cronOptions = {
        timezone: "America/Mexico_City"
    };

    // Ambas tareas programadas para las 10 AM
    cron.schedule('0 10 * * *', () => {
        console.log('🚀 Ejecutando verificación de cumpleaños a las 10 AM');
        checkBirthdays();
    }, cronOptions);

    cron.schedule('0 10 * * *', () => {
        console.log('📅 Ejecutando verificación de recordatorios de citas a las 10 AM');
        checkAppointments();
    }, cronOptions);
};

module.exports = AllJobs;