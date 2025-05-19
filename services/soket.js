// socket.js
const socketIO = require('socket.io');

let io;

function initSocket(server) {
  io = socketIO(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('🟢 Cliente conectado al socket:', socket.id);

    socket.on('disconnect', () => {
      console.log('🔴 Cliente desconectado del socket:', socket.id);
    });
  });
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io no ha sido inicializado. Llama a initSocket primero.');
  }
  return io;
}

module.exports = { initSocket, getIO };
