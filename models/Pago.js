const mongoose = require('mongoose');
const {Schema} = mongoose;

const PagoSchema = new Schema({
    
    pacienteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Paciente',
        required: true
    },
    recordatorioPago: {
        type: Date, 
        required: true, 
    },
    limitePago: {
        type: Date, 
        required: true, 
    },
    validadorPago:{
        type: Boolean,
        required: false,
    }

    
   
});


module.exports = mongoose.model('Pago',PagoSchema);