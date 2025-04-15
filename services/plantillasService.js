const axios = require('axios');

const enviarFelicitacion = async (numeroPaciente, nombrepaciente) => {
        
        const token = 'EAAIfZAcqC9igBO94uMac2JIPQlBEGrBmpYAzkyl4OyinGJmpYgZBgwF1xCtgryeXhMw1ZBYmN6XvjrIfwPSvULpd8iNbrrT1T7DUJUIm2IrR0iw7vnyk4sKjwiVMlld6VbOmRgREZA5rOcQLPQr5bZA8whHL5wAWeNeZCorvDj4F3oZCesjdgbWYfwBv0ZCx2dcg7wZDZD';
        const url = 'https://graph.facebook.com/v22.0/164144560120336/messages';
    
        const data = {
            messaging_product: "whatsapp",
            to: numeroPaciente,
            type: "template",
            template: {
                name: "cumpleanos",
                language: {
                    code: "en"
                },
                "components": [
                    {
                        "type": "body",
                        "parameters": [
                            {
                                "type": "text",
                                "text": nombrepaciente
                            }
                        ]
                    }
                ]
            }
        };
    
        const config = {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };
    
        try {
            const response = await axios.post(url, data, config);
            console.log('Respuesta:', response.data);
        } catch (error) {
            console.error('Error:', error.response ? error.response.data : error.message);
        }

};

const enviarRecordatorio = async (numeroPaciente, nombrePaciente, horaCita, ampm) => {
    // Limpiar el número de teléfono (eliminar prefijo '52' si existe)
    const telefono = numeroPaciente.toString().replace(/^52/, '');
    
    const token = 'EAAIfZAcqC9igBO94uMac2JIPQlBEGrBmpYAzkyl4OyinGJmpYgZBgwF1xCtgryeXhMw1ZBYmN6XvjrIfwPSvULpd8iNbrrT1T7DUJUIm2IrR0iw7vnyk4sKjwiVMlld6VbOmRgREZA5rOcQLPQr5bZA8whHL5wAWeNeZCorvDj4F3oZCesjdgbWYfwBv0ZCx2dcg7wZDZD';
    const url = 'https://graph.facebook.com/v22.0/164144560120336/messages';

    const data = {
        messaging_product: "whatsapp",
        to: `52${telefono}`, // Asegurar que tenga el prefijo 52
        type: "template",
        template: {
            name: "tolerancia",
            language: {
                code: "en"
            },
            components: [
                {
                    type: "body",
                    parameters: [
                        {
                            type: "text",
                            text: nombrePaciente
                        },
                        {
                            type: "text",
                            text: horaCita
                        },
                        {
                            type: "text",
                            text: ampm
                        }
                    ]
                }
            ]
        }
    };

    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        timeout: 10000
    };

    try {
        const response = await axios.post(url, data, config);
        console.log('Recordatorio enviado:', response.data);
        return true;
    } catch (error) {
        console.error('Error al enviar recordatorio:', error.response ? {
            status: error.response.status,
            data: error.response.data
        } : error.message);
        return false;
    }
};


const enviarMensajeWhatsApp = async (numeroPaciente, mensaje) => {
        
        const token = 'EAAIfZAcqC9igBO94uMac2JIPQlBEGrBmpYAzkyl4OyinGJmpYgZBgwF1xCtgryeXhMw1ZBYmN6XvjrIfwPSvULpd8iNbrrT1T7DUJUIm2IrR0iw7vnyk4sKjwiVMlld6VbOmRgREZA5rOcQLPQr5bZA8whHL5wAWeNeZCorvDj4F3oZCesjdgbWYfwBv0ZCx2dcg7wZDZD';
        const url = 'https://graph.facebook.com/v22.0/164144560120336/messages';
    
        const data = {
            messaging_product: "whatsapp",
            to: numeroPaciente,
            type: "template",
            template: {
                name: "example_plan",
                language: {
                    code: "en"
                },
                "components": [
                    {
                        "type": "body",
                        "parameters": [
                            {
                                "type": "text",
                                "text": mensaje
                            }
                        ]
                    }
                ]
            }
        };
    
        const config = {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };
    
        try {
            const response = await axios.post(url, data, config);
            console.log('Respuesta:', response.data);
        } catch (error) {
            console.error('Error:', error.response ? error.response.data : error.message);
        }

};


module.exports = {
    enviarRecordatorio,
    enviarFelicitacion,
    enviarMensajeWhatsApp
};