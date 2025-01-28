const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
require('dotenv').config()

const PORT = process.env.PORT || 3000

const app = express()

app.use(
  cors({
    origin: process.env.FRONT,
    methods: ['GET', 'POST']
  })
)

app.get('/', (req, res) => {
  res.send('Servidor Node.js rodando com HTTP!')
})

const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: process.env.FRONT,
    methods: ['GET', 'POST']
  }
})

let filaNormal = 1
let filaPreferencial = 1
let senhaAtual = filaNormal
let tipoAtual = 'Normal'

io.on('connection', socket => {
  console.log('Novo cliente conectado:', socket.id)

  socket.emit('estadoInicial', {
    senhaAtual,
    tipoAtual,
    filaNormal,
    filaPreferencial
  })

  socket.on('resetarContadores', () => {
    filaNormal = 1
    filaPreferencial = 1
    senhaAtual = filaNormal
    tipoAtual = 'Normal'

    console.log('Contadores resetados.')
    io.emit('estadoAtualizado', {
      senhaAtual,
      tipoAtual,
      filaNormal,
      filaPreferencial
    })
  })

  socket.on('chamarProximaNormal', () => {
    senhaAtual = filaNormal
    tipoAtual = 'Normal'
    filaNormal++

    console.log(`Senha normal chamada: ${senhaAtual}`)
    io.emit('estadoAtualizado', {
      senhaAtual,
      tipoAtual,
      filaNormal,
      filaPreferencial
    })
  })

  socket.on('chamarProximaPreferencial', () => {
    senhaAtual = filaPreferencial
    tipoAtual = 'Preferencial'
    filaPreferencial++

    console.log(`Senha preferencial chamada: ${senhaAtual}`)
    io.emit('estadoAtualizado', {
      senhaAtual,
      tipoAtual,
      filaNormal,
      filaPreferencial
    })
  })

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id)
  })
})

server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}...`)
})
