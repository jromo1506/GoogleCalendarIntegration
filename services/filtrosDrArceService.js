const moment = require("moment");

const filterSlotsByRules = (availableSlots) => {
  const rules = {
    martes: { start: "16:00", end: "19:00" },
    miercoles: { start: "10:00", end: "13:00" },
    jueves: { start: "16:00", end: "19:00" }
  };

  const today = moment();
  const todayName = today.format("dddd").toLowerCase();

  // Filtrar slots según las reglas horarias
  const filteredByTime = availableSlots.filter(slot => {
    const dayRules = rules[slot.day];
    return dayRules && 
           slot.start >= dayRules.start && 
           slot.end <= dayRules.end;
  });

  // Ordenar por fecha y hora
  const sortedSlots = [...filteredByTime].sort((a, b) => {
    const dateCompare = new Date(a.date) - new Date(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.start.localeCompare(b.start);
  });

  // Calcular anticipación requerida
  const getRequiredDaysAhead = () => {
    const dayOfWeek = today.day();
    if (dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0) { // viernes, sábado o domingo
      return 2;
    }
    return 2 - (4 - dayOfWeek);
  };

  const minDate = moment().add(getRequiredDaysAhead(), 'days').startOf('day');
  const filteredByDate = sortedSlots.filter(slot => 
    moment(slot.date).isSameOrAfter(minDate)
  );

  // Seleccionar los 2 días más cercanos con disponibilidad
  const result = [];
  const daysFound = new Set();
  
  for (const slot of filteredByDate) {
    if (!daysFound.has(slot.date)) {
      result.push(slot);
      daysFound.add(slot.date);
      
      if (result.length >= 2) break;
    }
  }

  return result;
};

const getEarliestSlots = (availableSlots) => {
  return availableSlots;
};



module.exports = { filterSlotsByRules, getEarliestSlots };