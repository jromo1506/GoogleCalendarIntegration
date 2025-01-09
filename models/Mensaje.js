const mongoose = require('mongoose');

const MensajeSchema = new mongoose.Schema({
    
    idPaciente:{
        type:String,
        required:false
    },
    mensaje:{
        type:String,
        required:false
    },
    // noLeido 
    // leido 
    // esperandoRespuesta
    // urgente
    estado:{
        type:String,
        required:true
    }
    
});

const Mensaje = mongoose.model('Mensaje', MensajeSchema);
module.exports = Mensaje