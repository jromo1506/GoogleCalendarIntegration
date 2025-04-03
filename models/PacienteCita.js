const mongoose = require('mongoose');
const {Schema} = mongoose;

const PacienteCitaSchema = new Schema({
    
    pacienteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Paciente',
        required: true
    },
    idsCitas: [{
        type: String,
        required:false
    }],
    recordatorioCita: {
         type: Date, 
         required: true, 
    },


    
   
});


module.exports = mongoose.model('PacienteCita',PacienteCitaSchema);