const mongoose = require('mongoose');
const {Schema} = mongoose;

const CitasSchema = new Schema({
    

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