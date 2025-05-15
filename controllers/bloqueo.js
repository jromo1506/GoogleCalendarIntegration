const { oauth2Client, calendarService } = require('../services/googleAuthService');
const refreshTokenService = require('../services/refreshTokenService');
const filtros2 =require('../services/filtros2');
const moment = require('moment');




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


// Genera la cita escalonada
exports.crearCitaCV = async (req, res) => {
  try {
    await setAuthCredentials(email); // Establece las credenciales de autenticación
    const calendarId1 = req.params.calendarId1 + "@group.calendar.google.com"; // ID del primer calendario
    const calendarId2 = req.params.calendarId2 + "@group.calendar.google.com"; // ID del segundo calendario
    
    const { summary, description, startDateTime, endDateTime } = req.body; // Datos del evento

    if (!calendarId1 || !calendarId2 || !summary || !startDateTime || !endDateTime) {
      return res.status(400).json({ error: 'Faltan datos requeridos para crear el evento.' });
    }

    // Formato esperado para el primer evento
    const event1 = {
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

    // Crear el primer evento en el primer calendario
    calendarService.events.insert(
      {
        calendarId: calendarId1, // ID del primer calendario
        resource: event1, // Datos del primer evento
      },
      (err, createdEvent1) => {
        if (err) {
          console.error('Error al crear el primer evento:', err);
          return res.status(500).json({ error: 'No se pudo crear el primer evento.' });
        }

        // Calcular el tiempo de inicio y fin del segundo evento
        const secondEventStart = new Date(new Date(endDateTime).getTime());
        secondEventStart.setMinutes(secondEventStart.getMinutes()); // El segundo evento empieza 1 minuto después del primer evento

        // Crear el segundo evento en el segundo calendario
        const secondEventEnd = new Date(secondEventStart.getTime());
        secondEventEnd.setMinutes(secondEventEnd.getMinutes() + 45); // Duración de 45 minutos

        const event2 = {
          summary: "Reunión subsecuente", // Título del segundo evento
          description: "Evaluación del progreso", // Descripción del segundo evento
          start: {
            dateTime: secondEventStart.toISOString(), // Fecha y hora de inicio del segundo evento
            timeZone: 'America/Mexico_City', // Zona horaria
          },
          end: {
            dateTime: secondEventEnd.toISOString(), // Fecha y hora de fin del segundo evento
            timeZone: 'America/Mexico_City', // Zona horaria
          },
        };

        // Crear el segundo evento en el segundo calendario
        calendarService.events.insert(
          {
            calendarId: calendarId2, // ID del segundo calendario
            resource: event2, // Datos del segundo evento
          },
          (err, createdEvent2) => {
            if (err) {
              console.error('Error al crear el segundo evento:', err);
              return res.status(500).json({ error: 'No se pudo crear el segundo evento.' });
            }
            
            res.status(201).json({
              message: 'Eventos creados exitosamente',
              event1: createdEvent1.data,
              event2: createdEvent2.data,

            
            });
          }
        );
      }
    );
  } catch (error) {
    console.error('Error al asignar el evento:', error);
    res.status(500).send('Error al configurar las credenciales');
  }
};


const getTwoWeeksRange = () => {
  const today = new Date();
  const startOfRange = new Date(today);
  
  // Si es domingo, empezamos desde hoy, sino desde el lunes anterior
  if (today.getDay() !== 0) {
    startOfRange.setDate(today.getDate() - (today.getDay() - 1));
  }
  
  const endOfRange = new Date(startOfRange);
  endOfRange.setDate(startOfRange.getDate() + 13); // 2 semanas completas (14 días)

  return {
    start: startOfRange.toISOString().split("T")[0],
    end: endOfRange.toISOString().split("T")[0]
  };
};

const config = {
  daysOfWeek: [1, 2, 3], // Martes, Miércoles, Jueves
  timeRange: { start: "10:00", end: "20:00" },
  dateRange: getTwoWeeksRange()  // Nueva función específica para 2 semanas
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











exports.bloquearHorario = async (req, res) => {
  try {
    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
    const { calendarId, fechaInicio, fechaFin } = req.body;

    if (!calendarId || !fechaInicio || !fechaFin) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    // Convertimos las fechas de inicio y fin a objetos moment
    const start = moment(fechaInicio);
    const end = moment(fechaFin);

    const bloques = [];
    let bloqueInicio = start;

    // Generar bloques de 45 minutos hasta que se llegue a la hora de fin
    while (bloqueInicio.isBefore(end)) {
      const bloqueFin = moment.min(bloqueInicio.clone().add(45, 'minutes'), end);

      bloques.push({
        summary: 'Horario bloqueado',
        description: 'Este horario ha sido bloqueado para evitar reservas.',
        start: {
          dateTime: bloqueInicio.toISOString(),
          timeZone: 'America/Mexico_City',
        },
        end: {
          dateTime: bloqueFin.toISOString(),
          timeZone: 'America/Mexico_City',
        },
        transparency: 'opaque',
      });

      // Avanzamos al siguiente bloque de 45 minutos
      bloqueInicio = bloqueFin;
    }

    // Insertar los eventos en Google Calendar
    for (const evento of bloques) {
      await calendar.events.insert({
        calendarId,
        resource: evento,
      });
    }

    res.status(200).json({
      message: 'Horarios bloqueados con éxito',
      bloques,
    });
  } catch (error) {
    console.error('Error al bloquear horario:', error);
    res.status(500).json({ error: 'Error al bloquear el horario' });
  }
};




exports.getAllAvailableSlots = async (req, res) => {
   try {
     const dateRange = {
       start: new Date(),
       end: moment().add(1, 'month').toDate()
     };
     const { daysOfWeek, timeRange } = config;
     await setAuthCredentials(email);
 
     const calendarId = req.params.calendarId + "@group.calendar.google.com";
 
     // Obtener eventos ocupados
     const busyEvents = await getBusyEvents(
       calendarId,
       new Date(dateRange.start).toISOString(),
       new Date(dateRange.end).toISOString()
     );
 
     // Generar todos los slots disponibles (con bloques de 45 minutos)
     const allGeneratedSlots = generateAvailableSlots(daysOfWeek, timeRange, dateRange, busyEvents);
 
     // Filtrar los días y horas disponibles (según reglas y que no choquen con eventos ocupados)
     const workingDaySlots = filtros2.filterWorkingDaysOnly(allGeneratedSlots, busyEvents);
 
     // Agrupar los slots por fecha
     const groupedSlots = workingDaySlots.reduce((acc, slot) => {
       const slotDate = moment(slot.date).format('YYYY-MM-DD');
       if (!acc[slotDate]) {
         acc[slotDate] = [];
       }
       acc[slotDate].push({ start: slot.start, end: slot.end });
       return acc;
     }, {});
 
     res.json(groupedSlots);
   } catch (error) {
     console.error('Error al obtener horarios disponibles:', error);
     res.status(500).send('Error al obtener horarios disponibles');
   }
 };