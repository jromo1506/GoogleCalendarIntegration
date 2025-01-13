const express = require('express');
const router = express.Router();
const  calendarController  = require('../controllers/calendarController');
const usuarioController = require('../controllers/usuariosController');
const citasController = require('../controllers/citasController');

const pacienteController = require ('../controllers/pacienteController');
const mensajeController = require ('../controllers/mensajeController');


// Routes for calendar operations
router.get('/auth', calendarController.auth);
router.get('/authRedirect', calendarController.authRedirect);
router.get('/calendars', calendarController.listCalendars);
router.get('/getCitas/:calendarId', calendarController.obtenerCitasDeCalendarioPorId);
router.post('/crearEvento/:calendarId', calendarController.crearEvento);
router.get('/getAvailableSlots/:calendarId',calendarController.getAvailableSlots);
router.post('/crearCitaCV/:calendarId1/:calendarId2',calendarController.crearCitaCV)

router.post('/user/', usuarioController.crearUsuario);
router.post('/usuarios/auth', usuarioController.autenticarUsuario);
router.get('/user/', usuarioController.obtenerUsuarios);
router.get('/user/:id', usuarioController.obtenerUsuarioPorId);
router.put('/user/:id', usuarioController.actualizarUsuario);
router.delete('/user/:id', usuarioController.eliminarUsuario);

router.post('/citas', citasController.crearCita);
router.get('/citas', citasController.obtenerCitas);
router.get('/citas/:id', citasController.obtenerCitaPorId);
router.put('/citas/:id', citasController.actualizarCita);
router.delete('/citas/:id', citasController.eliminarCita);


router.post('/paciente', pacienteController.crearPaciente);
router.get('/pacientes', pacienteController.obtenerPacientes);
router.get('/paciente/:id', pacienteController.obtenerPacientePorId);
router.put('/paciente/:id', pacienteController.actualizarPaciente);
router.delete('/paciente/:id', pacienteController.eliminarPaciente);
router.get('/buscarPacientePorTelefono/:telefono',pacienteController.buscarPacientePorNumeroTelefonico);
router.post('/addPaciente');


router.post('/addMensaje',mensajeController.addMensaje);
router.get('/getMensajes', mensajeController.getMensajes);
router.delete('/deleteMensaje/:id',mensajeController.deleteMensaje);



module.exports = router;
