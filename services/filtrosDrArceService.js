const moment = require("moment");

const filterSlotsByRules = (availableSlots) => {
  // Definir las reglas para cada día
  const rules = {
    martes: { start: "16:00", end: "20:00" },   // Martes: 4:00pm - 8:00pm
    miercoles: { start: "10:00", end: "14:00" }, // Miércoles: 10:00am - 2:00pm
    jueves: { start: "16:00", end: "20:00" }   // Jueves: 4:00pm - 8:00pm
  };

  const today = moment().format("dddd").toLowerCase(); // Obtener el día actual
  console.log("Día actual detectado:", today);

  let validDays = [];

  if (today === "monday") {
    validDays = ["miercoles", "jueves"];
  } else if (today === "tuesday") {
    validDays = ["jueves"];
  } else if (["wednesday", "thursday", "friday", "saturday", "sunday"].includes(today)) {
    validDays = ["martes", "miercoles", "jueves"];
    availableSlots = availableSlots.map(slot => {
      let slotDate = moment(slot.date);
      if (slotDate.isBefore(moment().add(4, "days"), "week")) {
        slotDate = slotDate.add(1, "week");
      }
      return { ...slot, date: slotDate.format("YYYY-MM-DD") };
    });
  }

  const filteredSlots = availableSlots.filter(slot => {
    const { day, start, end } = slot;
    return validDays.includes(day) && rules[day] && start >= rules[day].start && end <= rules[day].end;
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