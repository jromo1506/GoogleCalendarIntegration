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


const getDynamicRange = () => {
  const today = new Date();
  const startOfRange = new Date(today);
  startOfRange.setDate(today.getDate() - 1); // Incluir desde ayer
  
  const endOfRange = new Date(startOfRange);
  endOfRange.setDate(startOfRange.getDate() + 35); // 5 semanas hacia adelante

  return {
    start: startOfRange.toISOString().split("T")[0],
    end: endOfRange.toISOString().split("T")[0]
  };
};

const config = {
  daysOfWeek: [1, 2, 3], // Martes, Miércoles, Jueves
  timeRange: { start: "10:00", end: "20:00" },
  dateRange: getDynamicRange()
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

// Función para generar horarios disponibles considerando huecos entre citas
const generateAvailableSlots = (daysOfWeek, timeRange, dateRange, busyEvents) => {
  const { start, end } = dateRange;
  const { start: startTime, end: endTime } = timeRange;

  const startDate = new Date(start);
  const endDate = new Date(end);
  const availableSlots = [];

  const dayNames = ["lunes", "martes", "miercoles", "jueves", "viernes", "sábado", "domingo"];
  const slotDuration = 45; // Duración de la cita en minutos

  // Ordenar eventos ocupados por fecha y hora
  const sortedBusyEvents = [...busyEvents].sort((a, b) => 
    new Date(a.start) - new Date(b.start)
  );

  // Generar fechas en el rango especificado
  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    const dayOfWeek = date.getDay();
    
    if (daysOfWeek.includes(dayOfWeek)) {
      const dayName = dayNames[dayOfWeek];
      const dateStr = date.toISOString().split("T")[0];
      
      // Obtener eventos ocupados para este día específico
      const dayBusyEvents = sortedBusyEvents.filter(event => 
        event.start.startsWith(dateStr)
      );

      // Si no hay eventos ocupados, generar todos los slots disponibles
      if (dayBusyEvents.length === 0) {
        let timeCursor = startTime;
        while (timeCursor < endTime) {
          const nextTime = incrementTime(timeCursor, slotDuration);
          if (nextTime <= endTime) {
            availableSlots.push(createSlot(dayName, dateStr, timeCursor, nextTime));
          }
          timeCursor = nextTime;
        }
      } else {
        // Verificar huecos antes del primer evento del día
        const firstEventStart = dayBusyEvents[0].start.split("T")[1].substring(0, 5);
        if (startTime < firstEventStart) {
          let timeCursor = startTime;
          while (timeCursor < firstEventStart) {
            const nextTime = incrementTime(timeCursor, slotDuration);
            if (nextTime <= firstEventStart) {
              availableSlots.push(createSlot(dayName, dateStr, timeCursor, nextTime));
            }
            timeCursor = nextTime;
          }
        }

        // Verificar huecos entre eventos
        for (let i = 0; i < dayBusyEvents.length - 1; i++) {
          const currentEventEnd = dayBusyEvents[i].end.split("T")[1].substring(0, 5);
          const nextEventStart = dayBusyEvents[i + 1].start.split("T")[1].substring(0, 5);
          
          if (currentEventEnd < nextEventStart) {
            let timeCursor = currentEventEnd;
            while (timeCursor < nextEventStart) {
              const nextTime = incrementTime(timeCursor, slotDuration);
              if (nextTime <= nextEventStart) {
                availableSlots.push(createSlot(dayName, dateStr, timeCursor, nextTime));
              }
              timeCursor = nextTime;
            }
          }
        }

        // Verificar huecos después del último evento del día
        const lastEventEnd = dayBusyEvents[dayBusyEvents.length - 1].end.split("T")[1].substring(0, 5);
        if (lastEventEnd < endTime) {
          let timeCursor = lastEventEnd;
          while (timeCursor < endTime) {
            const nextTime = incrementTime(timeCursor, slotDuration);
            if (nextTime <= endTime) {
              availableSlots.push(createSlot(dayName, dateStr, timeCursor, nextTime));
            }
            timeCursor = nextTime;
          }
        }
      }
    }
  }

  return availableSlots;
};

// Función auxiliar para crear un slot
const createSlot = (dayName, dateStr, start, end) => ({
  index: 0, // Se actualizará después
  day: dayName,
  date: dateStr,
  start: start,
  end: end
});

// Actualizar la función incrementTime para manejar correctamente las horas
const incrementTime = (time, incrementMinutes) => {
  const [hourStr, minuteStr] = time.split(":");
  let hour = parseInt(hourStr, 10);
  let minute = parseInt(minuteStr, 10);
  
  minute += incrementMinutes;
  hour += Math.floor(minute / 60);
  minute = minute % 60;
  
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
};