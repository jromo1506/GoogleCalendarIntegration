const axios = require('axios');

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

module.exports = enviarMensajeWhatsApp;