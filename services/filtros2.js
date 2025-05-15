const moment = require("moment");

// Reglas por número de día (0=domingo, ..., 6=sábado)
const generateAvailableSlots = (daysOfWeek, timeRange, dateRange, busyEvents) => {
   const slots = [];

   // Reglas usando números de día (martes = 2, miércoles = 3, jueves = 4)
   const rules = {
      2: { start: "16:00", end: "20:00" },  // martes
      3: { start: "10:00", end: "14:00" },  // miércoles
      4: { start: "16:00", end: "20:00" }   // jueves
   };

   let currentDate = moment(dateRange.start);
   const endDate = moment(dateRange.end);

   console.log("\nGenerando slots desde:", currentDate.format("YYYY-MM-DD"), "hasta:", endDate.format("YYYY-MM-DD"));

   while (currentDate.isSameOrBefore(endDate)) {
      const dayNumber = currentDate.day();
      const dateStr = currentDate.format("YYYY-MM-DD");

      if (rules[dayNumber]) {
         const { start, end } = rules[dayNumber];
         const startHour = moment(`${dateStr} ${start}`, "YYYY-MM-DD HH:mm");
         const endHour = moment(`${dateStr} ${end}`, "YYYY-MM-DD HH:mm");

         console.log(`\nProcesando ${dateStr} (${currentDate.format("dddd")}):`,
            `Horario: ${start} a ${end}`);

         let slotStart = startHour.clone();
         while (slotStart.isBefore(endHour)) {
            const slotEnd = slotStart.clone().add(45, 'minutes');
            if (slotEnd.isAfter(endHour)) break;

            const slot = {
               date: dateStr,
               day: dayNumber,
               start: slotStart.format("HH:mm"),
               end: slotEnd.format("HH:mm"),
               datetimeStart: slotStart.toISOString(),
               datetimeEnd: slotEnd.toISOString()
            };

            slots.push(slot);
            console.log(`  Slot agregado: ${slot.start}-${slot.end}`);

            slotStart.add(45, 'minutes');
         }
      } else {
         console.log(`Omitiendo ${dateStr} (${currentDate.format("dddd")}): No es día laboral`);
      }

      currentDate.add(1, 'day');
   }

   console.log("\nTotal slots generados:", slots.length);
   return slots;
};

// Filtrar días laborales y evitar eventos ocupados
const filterWorkingDaysOnly = (allSlots, busyEvents) => {
   console.log("\nFiltrando slots...");
   console.log("Eventos ocupados recibidos:", busyEvents.length);

   const today = moment().startOf("day");
   const rules = {
      2: { start: "16:00", end: "20:00" },
      3: { start: "10:00", end: "14:00" },
      4: { start: "16:00", end: "20:00" }
   };

   const filteredSlots = allSlots.filter(slot => {
      const slotDate = moment(slot.date, "YYYY-MM-DD");
      const dayNumber = slotDate.day();
      const rule = rules[dayNumber];

      // Verificar si es un día futuro con reglas definidas
      if (!rule || !slotDate.isSameOrAfter(today)) {
         return false;
      }

      // Verificar que el slot esté dentro del horario laboral
      const slotStart = moment(`${slot.date} ${slot.start}`, "YYYY-MM-DD HH:mm");
      const slotEnd = moment(`${slot.date} ${slot.end}`, "YYYY-MM-DD HH:mm");
      const ruleStart = moment(`${slot.date} ${rule.start}`, "YYYY-MM-DD HH:mm");
      const ruleEnd = moment(`${slot.date} ${rule.end}`, "YYYY-MM-DD HH:mm");

      const isInTimeRange = slotStart.isSameOrAfter(ruleStart) && slotEnd.isSameOrBefore(ruleEnd);
      if (!isInTimeRange) {
         console.log(`Slot ${slot.date} ${slot.start}-${slot.end}: Fuera del horario laboral`);
         return false;
      }

      // Verificar colisión con eventos ocupados
      const overlapsBusy = busyEvents.some(event => {
         const eventStart = moment(event.start);
         const eventEnd = moment(event.end);
         return slotStart.isBefore(eventEnd) && slotEnd.isAfter(eventStart);
      });

      if (overlapsBusy) {
         console.log(`Slot ${slot.date} ${slot.start}-${slot.end}: Colisión con evento ocupado`);
         return false;
      }

      console.log(`Slot ${slot.date} ${slot.start}-${slot.end}: Aceptado`);
      return true;
   });

   console.log("\nTotal slots después de filtrar:", filteredSlots.length);
   return filteredSlots;
};

module.exports = {
   filterWorkingDaysOnly,
   generateAvailableSlots
};