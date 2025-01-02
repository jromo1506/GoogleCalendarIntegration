const TokenModel = require('../models/Token');

// Guardar o actualizar el refresh_token
exports.saveRefreshTokenToDB = async (email, refreshToken) => {
  try {
    await TokenModel.updateOne(
      { email }, // Busca por email
      { refreshToken, createdAt: new Date() }, // Actualiza o crea nuevos datos
      { upsert: true } // Crea un nuevo documento si no existe
    );
    console.log(`Refresh token guardado/actualizado para ${email}`);
  } catch (error) {
    console.error('Error al guardar el refresh_token:', error);
    throw error;
  }
};

// Obtener el refresh_token por email
exports.getRefreshTokenFromDB = async (email) => {
  try {
    const tokenRecord = await TokenModel.findOne({ email });
    return tokenRecord ? tokenRecord.refreshToken : null; // Devuelve el token o null si no existe
  } catch (error) {
    console.error('Error al obtener el refresh_token:', error);
    throw error;
  }
};

// Eliminar el refresh_token (opcional)
exports.deleteRefreshToken = async (email) => {
  try {
    await TokenModel.deleteOne({ email });
    console.log(`Refresh token eliminado para ${email}`);
  } catch (error) {
    console.error('Error al eliminar el refresh_token:', error);
    throw error;
  }
};