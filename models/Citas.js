const mongoose = require('mongoose');
const {Schema} = mongoose;

const CitasSchema = new Schema({
    

    tratamiento: {
        type: String,
        required: true,
    },
    fecha:{
        type:Date,
        required:true
    },
    hora_inicio: {
        type: String,
        required: true
    },
     hora_final: {
        type: String,
        required: false,
    },
    observaciones:{
        type:String,
        required:false,
    },
    realizo:{
        type:String,
        required:false
    }
});


module.exports = mongoose.model('Citas',CitasSchema);