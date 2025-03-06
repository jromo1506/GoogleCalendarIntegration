// jobs/plantillas.js
const axios = require('axios');

// Configuración inicial
const PHONE_NUMBER_ID = '164144560120336'; // Reemplaza con tu ID de número de teléfono
const ACCESS_TOKEN = 'EAAIfZAcqC9igBO94uMac2JIPQlBEGrBmpYAzkyl4OyinGJmpYgZBgwF1xCtgryeXhMw1ZBYmN6XvjrIfwPSvULpd8iNbrrT1T7DUJUIm2IrR0iw7vnyk4sKjwiVMlld6VbOmRgREZA5rOcQLPQr5bZA8whHL5wAWeNeZCorvDj4F3oZCesjdgbWYfwBv0ZCx2dcg7wZDZD'; // Reemplaza con tu token de acceso
const API_VERSION = 'v22.0'; // Versión de la API de WhatsApp
const RECIPIENT_NUMBER = '524492231673'; // Número de teléfono del destinatario
const TEMPLATE_NAME = 'prueba'; // Nombre de la plantilla aprobada

// Función para enviar un mensaje de plantilla
async function sendTemplateMessage() {
    const url = `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`;

    const data = {
        messaging_product: 'whatsapp',
        to: RECIPIENT_NUMBER,
        type: 'template',
        template: {
            name: TEMPLATE_NAME,
            language: {
                code: 'es', // Código de idioma (español en este caso)
            },
        },
    };

    const headers = {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
    };

    try {
        const response = await axios.post(url, data, { headers });
        console.log('Mensaje enviado:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error al enviar el mensaje:', error.response ? error.response.data : error.message);
        throw error;
    }
}

// Exportar la función
module.exports = sendTemplateMessage;