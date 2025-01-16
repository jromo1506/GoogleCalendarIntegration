const mongoose = require('mongoose');
const {Schema} = mongoose;

const CitasSchema = new Schema({
<<<<<<< HEAD
    idPaciente:{
        type:String,
        required:true
    },

=======
    
    pacienteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Paciente',
        required: true
    },
>>>>>>> d205aa2c62ea6996936118f394a6b6c3aef20ed2
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
    horaInicio:{
        type:String,
        required:false,
    },
    horaFin:{
        type:String,
        required:false,
    },
    realizo:{
        type:String,
        required:false
    }
});


module.exports = mongoose.model('Citas',CitasSchema);