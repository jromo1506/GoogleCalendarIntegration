const mongoose = require('mongoose');
const {Schema} = mongoose;

const CitasSchema = new Schema({
    
    pacienteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Paciente',
        required: true
    },
    tratamiento: {
        type: String,
        required: true,
    },
    observaciones:{
        type:String,
        required:false,
    },
    pago:{
        type:Number,
        required:false,
    },
    realizo:{
        type:String,
        required:false
    }
});


module.exports = mongoose.model('Citas',CitasSchema);