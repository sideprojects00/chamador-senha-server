const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

const app = express();

app.use(
  cors({
    origin: process.env.FRONT,
    methods: ['GET', 'POST'],
  })
);

app.get('/', (req, res) => {
  res.send('Servidor Node.js rodando com HTTP!');
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONT,
    methods: ['GET', 'POST'],
  },
});

let count = 0;

io.on('connection', (socket) => {
  console.log('Novo cliente conectado:', socket.id);

  socket.emit('atualizarCount', count);

  socket.on('incrementarCount', () => {
    count++;
    console.log('Novo valor do count:', count);

    io.emit('atualizarCount', count);
  });

  socket.on('atualizar', (dados) => {
    console.log('Atualização recebida:', dados);
    io.emit('atualizacao', dados);
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}...`);
});