const Paciente = require('../models/Paciente.js');


exports.addPaciente = async(req,res)=>{ 
    try{
        const nuevoPac = new Paciente(req.body);
        res.status(201).json(await nuevoPac.save());
    }
    catch(error){
        console.log("Error al crear un paciente");
    }
}


exports.getPacientes = async(req,res)=>{
  
}


exports.getPaciente = async(req,res) => {

}


exports.putPaciente = async(req,res) =>{

}