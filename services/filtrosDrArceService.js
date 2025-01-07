/*
Aqui se colocan unicamente los filtros que el dr arce quiso para su bot

*/
const filterSlotsByRules = (availableSlots) => {
  // Definir las reglas para cada día
  const rules = {
    martes: { start: "16:00", end: "20:00" },   // Martes: 4:00pm - 8:00pm
    jueves: { start: "16:00", end: "20:00" },  // Jueves: 4:00pm - 8:00pm
    miercoles: { start: "10:00", end: "14:00" } // Miércoles: 10:00am - 2:00pm
  };

  const filteredSlots = [];

  for (const slot of availableSlots) {
    const { day, start, end } = slot;

    // Verificar si hay una regla para el día actual (day es el nombre del día)
    if (rules[day]) {
      const { start: ruleStart, end: ruleEnd } = rules[day];

      // Filtrar horarios que están dentro del rango permitido
      if (start >= ruleStart && end <= ruleEnd) {
        filteredSlots.push(slot);
      }
    }
  }

  return filteredSlots;
};

const getEarliestSlots = (availableSlots) => {
  const earliestSlots = {};

  for (const slot of availableSlots) {
    const { day, start } = slot;

    // Si no existe un horario para este día o el actual es más temprano, actualizar
    if (!earliestSlots[day] || start < earliestSlots[day].start) {
      earliestSlots[day] = slot;
    }
  }

  // Convertir el objeto en un arreglo con un único horario por día
  return Object.values(earliestSlots);
};

  module.exports = {filterSlotsByRules, getEarliestSlots}