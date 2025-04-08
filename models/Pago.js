const mongoose = require('mongoose');
const {Schema} = mongoose;

const PagoSchema = new Schema({
    
    pacienteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Paciente',
        required: true
    },
    pacienteTel:{
        type: String, 
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
    },
    sessionId: {
        type: String,
        unique: true
    },
    monto: {
        type: Number
    },
    urlPago: {
        type: String
    },
    estado: {
        type: String,
        enum: ['pendiente', 'completado', 'expirado', 'cancelado'],
        default: 'pendiente'
    },
    fechaPago: {
        type: Date
    }
}, { timestamps: true });

module.exports = mongoose.model('Pago', PagoSchema);