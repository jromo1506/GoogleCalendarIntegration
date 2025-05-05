const moment = require("moment");

const filterSlotsByRules = (availableSlots) => {
  const rules = {
    martes: { start: "16:00", end: "20:00" },
    miercoles: { start: "10:00", end: "14:00" },
    jueves: { start: "16:00", end: "20:00" }
  };

  const today = moment();
  const todayName = today.format("dddd").toLowerCase();
  console.log("Día actual detectado:", todayName);

  // Determinar qué días mostrar según el día actual
  let showCurrentWeek = [];
  let showNextWeek = [];

  if (todayName === "monday") {
    showCurrentWeek = ["miercoles", "jueves"];
  } else if (todayName === "tuesday") {
    showCurrentWeek = ["jueves"];
    showNextWeek = ["martes"];
  } else {
    // miércoles a domingo
    showNextWeek = ["martes", "miercoles"];
  }

  // Filtrar slots según las reglas
  const filteredSlots = availableSlots.filter(slot => {
    const slotDate = moment(slot.date);
    const isNextWeek = slotDate.isAfter(today.endOf('week'));
    const dayRules = rules[slot.day];
    
    // Verificar si el slot cumple con las reglas horarias
    const validTime = dayRules && 
                     slot.start >= dayRules.start && 
                     slot.end <= dayRules.end;
    
    // Verificar si pertenece a la semana que debe mostrarse
    if (isNextWeek) {
      return showNextWeek.includes(slot.day) && validTime;
    } else {
      return showCurrentWeek.includes(slot.day) && validTime;
    }
  });

  return filteredSlots;
};

const getEarliestSlots = (availableSlots) => {
  const earliestSlots = {};

  for (const slot of availableSlots) {
    const { day, start } = slot;
    if (!earliestSlots[day] || start < earliestSlots[day].start) {
      earliestSlots[day] = slot;
    }
  }

  return Object.values(earliestSlots);
};

module.exports = { filterSlotsByRules, getEarliestSlots };