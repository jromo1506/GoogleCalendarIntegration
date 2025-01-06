/*
Aqui se colocan unicamente los filtros que el dr arce quiso para su bot

*/


const filterSlotsByRules = (availableSlots) => {
    // Definir las reglas para cada día
    const rules = {
      martes: { start: "16:00", end: "20:00" }, // 4:00pm - 8:00pm
      jueves: { start: "16:00", end: "20:00" }, // 4:00pm - 8:00pm
      miércoles: { start: "10:00", end: "14:00" } // 10:00am - 2:00pm
    };
  
    const filteredSlots = {};
  
    // Iterar sobre los días en los horarios disponibles
    for (const [day, slots] of Object.entries(availableSlots)) {
      // Verificar si el día tiene una regla específica
      if (rules[day]) {
        const { start: ruleStart, end: ruleEnd } = rules[day];
  
        // Filtrar los horarios que estén dentro del rango definido para este día
        filteredSlots[day] = slots.filter(({ start, end }) => {
          return start >= ruleStart && end <= ruleEnd;
        });
      } else {
        // Si no hay reglas para el día, mantener los horarios sin cambios
        filteredSlots[day] = slots;
      }
    }
  
    return filteredSlots;
  };



  // Busca la fecha mas cercana de cada dia
const getEarliestSlots = (availableSlots) => {
  const earliestSlots = {};

  for (const [day, slots] of Object.entries(availableSlots)) {
    if (slots.length > 0) {
      // Seleccionar el primer horario más temprano disponible
      earliestSlots[day] = slots[0];
    }
  }

  return earliestSlots;
};



  module.exports = {filterSlotsByRules, getEarliestSlots}