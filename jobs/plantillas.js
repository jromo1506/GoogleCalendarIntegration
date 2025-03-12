// jobs/plantillas.js
const axios = require('axios');

const enviarPlantilla = async () => {
    const token = 'EAAIfZAcqC9igBO6EiWKWRyFZBbkZAZBgLNhoW29V3knhxIWx7Vlbkda7zNKIHZC3ZAZAD0yZABHpVjmKwlAl2NZAoI9ZAHc2NZBdZCrgit7pTbn6xOooZC7GZB9klZCcOk5EI5ZAyeqr62TQ59j2M0r8VE5LcZCuCuciuuQZCZBsmCpBqw26vGRe5a9StRq11IZAJF0gQzNBqM3bsQf5ZCuByM5M0WVOfqQQ6wXUWQAjI4ZAKV7oVPCCt6Wd8ZD';
    const url = 'https://graph.facebook.com/v22.0/164144560120336/messages';

    const data = {
        messaging_product: "whatsapp",
        to: "524492231673",
        type: "template",
        template: {
            name: "prueba",
            language: {
                code: "Es"
            }
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

module.exports = enviarPlantilla;