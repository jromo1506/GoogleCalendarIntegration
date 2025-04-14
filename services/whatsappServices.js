const axios = require('axios');

exports.sendWhatsAppMessage = async ({ to, body }) => {
   try {
      const response = await axios.post(process.env.WHATSAPP_API_URL, {
         phone: to,
         message: body
      });
      return response.data;
   } catch (error) {
      console.error('Error enviando mensaje WhatsApp:', error);
      throw error;
   }
};

exports.triggerNextFlow = async (phoneNumber, flowName) => {
   try {
   
      const response = await axios.post(process.env.WHATSAPP_FLOW_API_URL, {
         phone: phoneNumber,
         flow: flowName
      });
      return response.data;
   } catch (error) {
      console.error('Error redirigiendo flujo:', error);
      throw error;
   }
};