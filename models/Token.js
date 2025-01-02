const mongoose = require('mongoose');

const TokenSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  refreshToken: { type: String, required: true },
});

const Token = mongoose.model('Token', TokenSchema);

module.exports = Token;