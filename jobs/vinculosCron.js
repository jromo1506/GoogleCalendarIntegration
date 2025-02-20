const cron = require('node-cron');
const PacienteCita = require('../models/PacienteCita');


const eliminarCitasExpiradas = () => {
    cron.schedule('* * * * *', async () => { // Se ejecuta cada minuto
        console.log('⏳ Revisando citas expiradas...');

        try {
            const ahora = new Date(); // Hora exacta actual
            const resultado = await PacienteCita.deleteMany({ 
                expiraEn: { 
                    $lte: ahora // Asegura que se eliminen solo las citas cuyo expiraEn ya pasó
                }
            });

            if (resultado.deletedCount > 0) {
                console.log(`✅ Eliminadas ${resultado.deletedCount} citas expiradas.`);
            } else {
                console.log('🔍 No hay citas expiradas.');
            }
        } catch (error) {
            console.error("❌ Error al eliminar citas expiradas:", error);
        }
    });
};


module.exports = eliminarCitasExpiradas;