const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const jwt = require('jsonwebtoken')
require('dotenv').config()

const PORT = process.env.PORT || 3000;
const SECRET_KEY = 'b9be05160dcb4da794c0ea8351eb7456c03c6c3f2bf29d490b8aab0e968de130'

const app = express()

const corsOptions = {
  origin: 'https://sideprojects00.github.io',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}

app.use(cors(corsOptions))

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

  socket.on('login', ({ username, password }) => {
    console.log("Login chamado!")
    console.log(username)
    console.log(password)
    if (username === 'admin' && password === '1234') {
      console.log("login aceito")
      const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' })
      socket.emit('loginSuccess', { token })
    } else {
      console.log("login negado")
      socket.emit('loginError', 'Usuário ou senha incorretos!')
    }
  })

  socket.on('authenticate', ({ token }) => {
    try {
      const decoded = jwt.verify(token, SECRET_KEY)
      socket.emit('authSuccess')
    } catch (err) {
      socket.emit('authError', 'Token inválido ou expirado!')
    }
  })

  socket.on('resetarContadores', () => {
    filaNormal = 1
    filaPreferencial = 1
    senhaAtual = filaNormal
    tipoAtual = 'Normal'
    historicoSenhas = []
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

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id)
  })
})

server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}...`)
})
