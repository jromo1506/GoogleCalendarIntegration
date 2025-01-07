const { oauth2Client, calendarService } = require('../services/googleAuthService');
const refreshTokenService = require('../services/refreshTokenService');
const filtrosDrArceService = require('../services/filtrosDrArceService');


const email = 'arcedental4@gmail.com'; 

exports.auth =  (req, res) => {
  // Generate the Google authentication URL
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Request offline access to receive a refresh token
    scope: [
    'https://www.googleapis.com/auth/calendar.events', // Permiso para crear/editar eventos
    'https://www.googleapis.com/auth/calendar.readonly'], // Scope for read-only access to the calendar
    prompt: 'consent',  
    login_hint:email,
  });
  // Redirect the user to Google's OAuth 2.0 server
  res.redirect(url);
}


exports.authRedirect = async (req, res) => {
  const code = req.query.code;

  try {
    const { tokens } = await oauth2Client.getToken(code); // Intercambia el código por tokens
    console.log("refrescar");
    if (tokens.refresh_token) {
      await refreshTokenService.saveRefreshTokenToDB(email, tokens.refresh_token); // Guarda el refresh_token
    }

    oauth2Client.setCredentials(tokens); // Configura las credenciales
    res.send('Autenticación exitosa. Puedes usar el sistema.');
  } catch (err) {
    console.error('Error al intercambiar el código por tokens:', err);
    res.status(500).send('Error en la autenticación');
  }
};

const setAuthCredentials = async (email) => {
  const refreshToken = await refreshTokenService.getRefreshTokenFromDB(email); // Obtén el refresh_token de la base de datos
  if (!refreshToken) {
    throw new Error('No se encontró el refresh_token');
  }
  oauth2Client.setCredentials({ refresh_token: refreshToken });
};



// Route to list all calendars
exports.listCalendars = async (req, res) => {

  try {
    // Llamada a setAuthCredentials dentro de una función async
    await setAuthCredentials(email);
    
    // Después de configurar las credenciales, puedes hacer llamadas a la API de Google
    const response = await calendarService.calendarList.list();
    res.json(response.data.items);
  } catch (error) {
    console.error('Error al configurar las credenciales:', error);
    res.status(500).send('Error al configurar las credenciales');
  }
};


exports.crearEvento = async (req,res) => {

  try{
    await setAuthCredentials(email);
    const  calendarId  = req.params.calendarId + "@group.calendar.google.com";  // ID del calendario
    const { summary, description, startDateTime, endDateTime } = req.body; // Datos del evento
    console.log(calendarId +" "+ summary +" "+  description +" "+  startDateTime +" "+  endDateTime);
    if (!calendarId || !summary || !startDateTime || !endDateTime) {
      return res.status(400).json({ error: 'Faltan datos requeridos para crear el evento.' });
    }
  
    // Formato esperado: YYYY-MM-DDTHH:mm:ssZ (Ejemplo: 2024-12-20T10:00:00Z)
    const event = {
      summary: summary, // Título del evento
      description: description, // Descripción
      start: {
        dateTime: startDateTime, // Fecha y hora de inicio (en formato ISO)
        timeZone: 'America/Mexico_City', // Establece la zona horaria, ajusta según sea necesario
      },
      end: {
        dateTime: endDateTime, // Fecha y hora de fin (en formato ISO)
        timeZone: 'America/Mexico_City', // Establece la zona horaria
      },
    };
  
    // Crear el evento utilizando la API de Google Calendar
    calendarService.events.insert(
      {
        calendarId: calendarId, // ID del calendario donde se añadirá el evento
        resource: event, // Datos del evento
      },
      (err, event) => {
        if (err) {
          console.error('Error al crear el evento:', err);
          return res.status(500).json({ error: 'No se pudo crear el evento.' });
        }
        res.status(201).json({ message: 'Evento creado exitosamente', event });
      }
    );

  } catch (error) {
    console.error('Error al asignar el evento:', error);
    res.status(500).send('Error al configurar las credenciales');
  }
  
}



exports.obtenerCitasDeCalendarioPorId = async (req, res) => {
  try{
    await setAuthCredentials(email);
    const calendarId = req.params.calendarId + "@group.calendar.google.com"; // Obtén el ID del calendario desde los parámetros de la ruta.

    if (!calendarId) {
      res.status(400).json({ error: 'Se requiere el ID del calendario.' });
      return;
    }
  
    calendarService.events.list(
      {
        calendarId: calendarId,
        maxResults: 2500, // Google Calendar API permite hasta 2500 eventos por solicitud.
        singleEvents: true, // Asegura que los eventos recurrentes se muestren como eventos individuales.
        orderBy: 'startTime', // Ordena los eventos por hora de inicio.
        timeMin: new Date().toISOString(), // Filtra eventos a partir del momento actual.
      },
      (err, response) => {
        if (err) {
          console.error('Error al obtener los eventos:', err);
          res.status(500).json({ error: 'No se pudo obtener los eventos.' });
          return;
        }
        res.json(response.data.items); // Devuelve los eventos en formato JSON.
      }
    );

  }
  catch(error){
    console.error('Error obtener citas:', error);
    res.status(500).send('Error al configurar las credenciales');
  }
 
};



// Buscar horarios disponibles
exports.getAvailableSlots = async (req, res) => {
  try {
    const { daysOfWeek, timeRange, dateRange } = config;
    await setAuthCredentials(email);

    const calendarId = req.params.calendarId + "@group.calendar.google.com"; // Obtén el ID del calendario desde los parámetros de la ruta.

    const busyEvents = await getBusyEvents(
      calendarId,
      new Date(dateRange.start).toISOString(),
      new Date(dateRange.end).toISOString()
    );
    console.log("Eventos ocupados:", busyEvents);

    const availableSlots = generateAvailableSlots(daysOfWeek, timeRange, dateRange, busyEvents);
    const filtroOperatorios = filtrosDrArceService.filterSlotsByRules(availableSlots);
    const fechasMasCercanas = filtrosDrArceService.getEarliestSlots(filtroOperatorios);
    res.json(fechasMasCercanas);
  } catch (error) {
    console.error('Error al obtener horarios disponibles:', error);
    res.status(500).send('Error al obtener horarios disponibles');
  }
};



// CONFUGRACIONES PARA CHECAR SI HAY DIAS OCUPADOS
/*
6: Domingo
0: Lunes
1: Martes
2: Miércoles
3: Jueves
4: Viernes
5: Sábado
*/


const calculateWeekRange = (rangeConfig) => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // Día de la semana (0 = domingo, 6 = sábado)

  // Calcular el inicio de la semana (domingo anterior o hoy si es domingo)
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek);
  
  // console.log("Hoy:", today.toISOString().split("T")[0]);
  // console.log("Día de la semana (hoy):", dayOfWeek);
  // console.log("Inicio de la semana (domingo):", startOfWeek.toISOString().split("T")[0]);

  let endOfRange;

  switch (rangeConfig) {
    case "1 semana":
      endOfRange = new Date(startOfWeek);
      endOfRange.setDate(startOfWeek.getDate() + 6); // Termina el sábado
      break;

    case "2 semanas":
      endOfRange = new Date(startOfWeek);
      endOfRange.setDate(startOfWeek.getDate() + 13); // Dos semanas (hasta el sábado)
      break;

    case "1 mes":
      endOfRange = new Date(startOfWeek);
      endOfRange.setMonth(startOfWeek.getMonth() + 1); // Un mes desde el inicio de la semana
      break;

    default:
      throw new Error("Configuración de rango no válida");
  }

  console.log("Fin del rango:", endOfRange.toISOString().split("T")[0]);


  return {
    start: startOfWeek.toISOString().split("T")[0], // Fecha de inicio en formato YYYY-MM-DD
    end: endOfRange.toISOString().split("T")[0]     // Fecha de fin en formato YYYY-MM-DD
  };
};

const config = {
  daysOfWeek: [1,2,3],
  timeRange: { start: "10:00", end: "20:00" }, // Horario: de 8:00 AM a 8:00 PM
  dateRange: calculateWeekRange("1 semana")  // Rango de fechas
};



const getBusyEvents = async (calendarId, timeMin, timeMax) => {
  const response = await calendarService.events.list({
    calendarId,
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: 'startTime',
  });
  return response.data.items.map(event => ({
    start: event.start.dateTime,
    end: event.end.dateTime
  }));
};


const incrementTime = (time, incrementMinutes) => {
  const [hour, minute] = time.split(":").map(Number);
  const totalMinutes = hour * 60 + minute + incrementMinutes;
  const newHour = Math.floor(totalMinutes / 60);
  const newMinute = totalMinutes % 60;
  return `${newHour.toString().padStart(2, "0")}:${newMinute.toString().padStart(2, "0")}`;
};

// Función para generar horarios disponibles con bloques de 45 minutos
// Función para generar horarios disponibles con bloques de 45 minutos
const generateAvailableSlots = (daysOfWeek, timeRange, dateRange, busyEvents) => {
  const { start, end } = dateRange;
  const { start: startTime, end: endTime } = timeRange;

  const startDate = new Date(start);
  const endDate = new Date(end);
  const availableSlots = []; // Cambiar a un array en lugar de un objeto

  const dayNames = ["lunes", "martes", "miercoles", "jueves", "viernes", "sábado","domingo"];

  // Generar fechas en el rango especificado
  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    const dayOfWeek = date.getDay(); // Obtener el día de la semana (0-6)

    // Comprobar si el día actual está en el array de días disponibles
    if (daysOfWeek.includes(dayOfWeek)) {
      const dayName = dayNames[dayOfWeek]; // Nombre del día
      const dateStr = date.toISOString().split("T")[0];
      let timeCursor = startTime;

      // Generar bloques horarios de 45 minutos
      while (timeCursor < endTime) {
        const nextTime = incrementTime(timeCursor, 45); // Bloques de 45 minutos
        const slotStart = `${dateStr}T${timeCursor}:00Z`;
        const slotEnd = `${dateStr}T${nextTime}:00Z`;

        // Verificar si el bloque está ocupado
        const isBusy = busyEvents.some(event => {
          const eventStart = event.start;
          const eventEnd = event.end;

          return (
            (slotStart >= eventStart && slotStart < eventEnd) || // Comienza dentro del evento
            (slotEnd > eventStart && slotEnd <= eventEnd) ||    // Termina dentro del evento
            (slotStart <= eventStart && slotEnd >= eventEnd)    // Envuelve completamente el evento
          );
        });

        if (!isBusy) {
          availableSlots.push({
            index: availableSlots.length + 1, // Índice numérico
            day: dayName, // Día de la semana
            date: dateStr, // Fecha del horario disponible
            start: timeCursor, // Hora de inicio
            end: nextTime, // Hora de fin
          });
        }

        timeCursor = nextTime;
      }
    }
  }

  return availableSlots;
};











