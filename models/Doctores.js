const mongoose = require('mongoose');
const {Schema} = mongoose;

const DoctorSchema = new Schema({
    
    nombre: {
        type: String,
        required: true,
    },
    correo: {
        type: String,
        required: true
    },
    especialidad: {
        type: String,
        required: false,
    },
    telefono:{
        type: Number,
        required: true
    }
});


module.exports = mongoose.model('Doctor',DoctorSchema);