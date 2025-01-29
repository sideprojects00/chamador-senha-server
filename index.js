const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const jwt = require('jsonwebtoken')
require('dotenv').config()

const PORT = process.env.PORT || 3000

const app = express()

const corsOptions = {
  origin: 'https://sideprojects00.github.io',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}

app.use(cors(corsOptions))

const secretKey = process.env.JWT_SECRET_KEY || 'yourSecretKey'

let logged = false

app.get('/', (req, res) => {
  res.send('Servidor Node.js rodando com HTTP!')
})

const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: 'https://sideprojects00.github.io',
    methods: ['GET', 'POST']
  }
})

let filaNormal = 1
let filaPreferencial = 1
let senhaAtual = filaNormal
let tipoAtual = 'Normal'
let historicoSenhas = []

const enviarEstadoAtualizado = () => {
  io.emit('estadoAtualizado', {
    senhaAtual,
    tipoAtual,
    filaNormal,
    filaPreferencial,
    historicoSenhas
  })
}

const adicionarAoHistorico = (senha, tipo) => {
  historicoSenhas.unshift({ senha, tipo })
  if (historicoSenhas.length > 7) {
    historicoSenhas.pop()
  }
}

io.on('connection', socket => {
  console.log('Novo cliente conectado:', socket.id)

  const token = socket.handshake.query.token
  let isLoggedIn = false

  if (token) {
    try {
      jwt.verify(token, secretKey)
      isLoggedIn = true
    } catch (err) {
      console.log('Token inválido:', err)
    }
  }

  socket.emit('estadoAtualizado', {
    senhaAtual,
    tipoAtual,
    filaNormal,
    filaPreferencial,
    historicoSenhas
  })

  socket.emit('checkLoginStatus', isLoggedIn)

  socket.on('resetarContadores', () => {
    filaNormal = 1
    filaPreferencial = 1
    senhaAtual = filaNormal
    tipoAtual = 'Normal'
    historicoSenhas = []

    console.log('Contadores resetados.')
    enviarEstadoAtualizado()
  })

  socket.on('chamarProximaNormal', () => {
    senhaAtual = filaNormal
    tipoAtual = 'Normal'
    adicionarAoHistorico(senhaAtual, tipoAtual)
    filaNormal++
    enviarEstadoAtualizado()
  })

  socket.on('chamarProximaPreferencial', () => {
    senhaAtual = filaPreferencial
    tipoAtual = 'Preferencial'
    adicionarAoHistorico(senhaAtual, tipoAtual)
    filaPreferencial++
    enviarEstadoAtualizado()
  })

  socket.on('validarLogin', ({ username, password }) => {
    console.log(username)
    console.log(password)
    if (username === 'recepcionista' && password === 'gghhpp') {
      const token = jwt.sign({ username }, secretKey, { expiresIn: '1h' })
      socket.emit('loginResult', { success: true, token })
    } else {
      socket.emit('loginResult', { success: false })
    }
  })

  socket.on('checkLogin', () => {
    socket.emit('checkLoginStatus', logged)
  })

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id)
  })
})

server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}...`)
})
