const express = require('express');
const  calendarController  = require('../controllers/calendarController');

const router = express.Router();

// Routes for calendar operations
router.get('/auth', calendarController.auth);
router.get('/authRedirect', calendarController.authRedirect);
router.get('/calendars', calendarController.listCalendars);
router.get('/events', calendarController.listEvents);

module.exports = router;