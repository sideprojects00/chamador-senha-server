const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
require('dotenv').config()

const PORT = process.env.PORT || 3000

const app = express()

app.use(
  cors({
    origin: "https://sideprojects00.github.io/",
    methods: ['GET', 'POST']
  })
)

app.get('/', (req, res) => {
  res.send('Servidor Node.js rodando com HTTP!')
})

const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: "https://sideprojects00.github.io/", 
    methods: ['GET', 'POST']
  }
})

let filaNormal = 1
let filaPreferencial = 1
let senhaAtual = filaNormal
let tipoAtual = 'Normal'

const enviarEstadoAtualizado = () => {
  io.emit('atualizarDados', {
    current: {
      num: senhaAtual,
      type: tipoAtual
    },
    nextNormal: filaNormal,
    nextPreferential: filaPreferencial
  })
}

io.on('connection', socket => {
  console.log('Novo cliente conectado:', socket.id)

  socket.emit('atualizarDados', {
    current: {
      num: senhaAtual,
      type: tipoAtual
    },
    nextNormal: filaNormal,
    nextPreferential: filaPreferencial
  })

  socket.on('resetarContadores', () => {
    filaNormal = 1
    filaPreferencial = 1
    senhaAtual = filaNormal
    tipoAtual = 'Normal'

    console.log('Contadores resetados.')
    enviarEstadoAtualizado()
  })

  socket.on('chamarProxima', ({ type }) => {
    if (type === 'Normal') {
      senhaAtual = filaNormal
      tipoAtual = 'Normal'
      filaNormal++
      console.log(`Senha normal chamada: ${senhaAtual}`)
    } else if (type === 'Preferencial') {
      senhaAtual = filaPreferencial
      tipoAtual = 'Preferencial'
      filaPreferencial++
      console.log(`Senha preferencial chamada: ${senhaAtual}`)
    } else {
      console.log('Tipo de senha inválido recebido:', type)
      return
    }

    enviarEstadoAtualizado()
  })

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id)
  })
})

server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}...`)
})
