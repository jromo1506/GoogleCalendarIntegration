const moment = require("moment");

const filterSlotsByRules = (availableSlots) => {
  const rules = {
    martes: { start: "16:00", end: "19:00" },
    miercoles: { start: "10:00", end: "13:00" },
    jueves: { start: "16:00", end: "19:00" }
  };

  const now = moment();
  const todayName = now.format("dddd").toLowerCase();

  // 1. Filtrar slots según las reglas horarias específicas de cada día
  const filteredByTime = availableSlots.filter(slot => {
    const dayRules = rules[slot.day];
    return dayRules && 
           slot.start >= dayRules.start && 
           slot.end <= dayRules.end;
  });

  // 2. Ordenar por fecha y hora (más cercanos primero)
  const sortedSlots = [...filteredByTime].sort((a, b) => {
    const dateCompare = new Date(a.date) - new Date(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.start.localeCompare(b.start);
  });

  // 3. Filtrar por anticipación mínima de 48 horas
  const filteredByAnticipation = sortedSlots.filter(slot => {
    const slotDateTime = moment(`${slot.date}T${slot.start}`);
    const hoursDifference = slotDateTime.diff(now, 'hours');
    return hoursDifference >= 48;
  });

  // 4. Seleccionar los primeros 2 días distintos con disponibilidad
  const result = [];
  const datesAdded = new Set();
  
  for (const slot of filteredByAnticipation) {
    if (!datesAdded.has(slot.date)) {
      result.push(slot);
      datesAdded.add(slot.date);
      
      if (result.length >= 2) break;
    }
  }

  return result;
};

const getEarliestSlots = (availableSlots) => {
  return availableSlots;
};

module.exports = { filterSlotsByRules, getEarliestSlots };