const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');

const PagoSchema = new Schema({
    pacienteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Paciente',
        required: true
    },
    pacienteTel: {
        type: String,
        required: true
    },
    recordatorioPago: {
        type: Date,
        required: true
    },
    limitePago: {
        type: Date,
        required: true
    },
    validadorPago: {
        type: Boolean,
        default: false
    },
    sessionId: {
        type: String,
        required: true,
        unique: true,
        default: () => uuidv4()
    },
    stripeSessionId: {
        type: String,
        default: () => `temp_${new mongoose.Types.ObjectId()}`, // Valor temporal único
        unique: true
    },
    monto: {
        type: Number,
        default: 75000 // $750 MXN
    },
    urlPago:{
        type:String
    },
    estado: {
        type: String,
        enum: ['pendiente', 'completado', 'expirado'],
        default: 'pendiente'
    },
    fechaPago: Date
}, { timestamps: true });

module.exports = mongoose.model('Pago', PagoSchema);