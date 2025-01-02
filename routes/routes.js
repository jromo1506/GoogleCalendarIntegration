const express = require('express');
const  calendarController  = require('../controllers/calendarController');

const router = express.Router();

// Routes for calendar operations
router.get('/auth', calendarController.auth);
router.get('/authRedirect', calendarController.authRedirect);
router.get('/calendars', calendarController.listCalendars);
router.get('/getCitas/:calendarId', calendarController.obtenerCitasDeCalendarioPorId);
router.post('/crearEvento/:calendarId', calendarController.crearEvento);
router.get('/getAvailableSlots/:calendarId',calendarController.getAvailableSlots);



module.exports = router;
