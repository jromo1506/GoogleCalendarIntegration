const cron = require('node-cron');

const checkBirthdays = require('./birthdayCron');
const checkAppointments = require('./citaCron');

const AllJobs = async () => {
    // Programación de tareas
    const cronOptions = {
        timezone: "America/Mexico_City"
    };

    // Cumpleaños a las 9 AM
    cron.schedule('0 9 * * *', () => {
        console.log('Verificando cumpleaños...');
        checkBirthdays();
    }, cronOptions);



    /* Recordatorios 
    Lunes - 4:00pm, 4:45pm, 5:30pm, 6:15pm, 7:00pm, 7:45pm
    Martes - 10:00am, 10:45am, 11:30am, 12:15am, 1:00pm, 1:45pm
    Miercoles - 4:00pm, 4:45pm, 5:30pm, 6:15pm, 7:00pm, 7:45pm
    */
    cron.schedule('* * * * *', () => {
        console.log('Verificando recordatorios de citas...');
        checkAppointments();
    }, cronOptions);

};


module.exports = AllJobs;
