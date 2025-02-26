const cron = require('node-cron');
const PacienteCita = require('../models/PacienteCita');
const Paciente = require('../models/Paciente');
const mongoose = require('mongoose'); // Importa mongoose
const axios = require("axios");

const WHATSAPP_API_URL = "https://graph.facebook.com/v19.0/537975159404404/messages";
const ACCESS_TOKEN = "EAAJMbvFBe4ABO2keVvAaz9LbdpMYWs2nDaaGd97Fiq9hf5J4srw0UhlCA2efzdWZBq96oQAawS2Ph2roQJzZAEMVAdD2INTW9c4tsi4xP0FEvZB3rZB7KJZCaC9GnVgYDm39vGZCyuYuJIpDZAG5ni9ZBYslaX49NRsuBOR3fmZBERZBJazfahOZBf3lKVFNzgGgq18HQZDZD";

/* BUSCA LA CITA Y LE MANDA MENSAJE AL USUARIO */
const eliminarCitasExpiradas = () => {
  cron.schedule('* * * * *', async () => { // Se ejecuta cada minuto
      console.log('⏳ Revisando citas expiradas...');

      try {
          const ahora = new Date(); // Hora exacta actual
          const resultado = await PacienteCita.find({ 
              expiraEn: { 
                  $lte: ahora, // Asegura que se obtengan solo las citas cuyo expiraEn ya pasó
              }
          });

          if (resultado.length > 0) {
              console.log(`✅ Se encontraron ${resultado.length} citas expiradas.`);
              console.log("pase por aqui 1");
              await mandarMensajeACadaNumero(resultado); // Pasamos el array directamente, no como un array de arrays
              console.log("pase por aqui 3");
              
              // await recordarCita();
          } else {
              console.log('🔍 No hay citas expiradas.');
          }
      } catch (error) {
          console.error("❌ Error al obtener citas expiradas:", error);
      }
  });
};

const mandarMensajeACadaNumero = async (vinculos) => {
  console.log("pase por aqui 2");
  try {
      let pacientesMensajear = [];

      for (let vinc of vinculos) {
          console.log("hole:" + vinc.pacienteId);
          let pacienteId = new mongoose.Types.ObjectId(vinc.pacienteId); // Usa 'new' para crear un ObjectId

          let paciente = await Paciente.findById(pacienteId); // Asegúrate de que es pacienteId, no idPaciente
          if (paciente) {
              pacientesMensajear.push({ paciente, citaId: vinc._id });
          }
      }
      console.log("hola:" + pacientesMensajear);

      if (pacientesMensajear.length > 0) {
          console.log(pacientesMensajear);
      }

  } catch (error) {
      console.error("❌ Error en mandarMensajeACadaNumero:", error);
  }
};
const recordarCita = async() =>{
    try {
        const response = await axios.post(
          WHATSAPP_API_URL,
          {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: "524495494260", // Reemplaza con tu número de WhatsApp
            type: "template",
            template: {
              name: "cita_sin_confirmar",
              language: { code: "es_MX" },
              components: [
                {
                  type: "header",
                  parameters: [
                    {
                      type: "text",
                      parameter_name: "nombre",
                      text: "Jorge",
                    },
                  ],
                },
              ],
            },
          },
          {
            headers: {
              Authorization: `Bearer ${ACCESS_TOKEN}`,
              "Content-Type": "application/json",
            },
          }
        );
    
        // res.json({ success: true, data: response.data });
        console.log(response.data);
      } catch (error) {
        console.error("Error enviando mensaje de WhatsApp:", error.response?.data || error.message);
        throw error;
      }
}


module.exports = eliminarCitasExpiradas;