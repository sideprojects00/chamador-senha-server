const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const session = require('express-session') // Importar express-session
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

const crypto = require('crypto');
const chaveSegura = crypto.randomBytes(64).toString('hex');

app.use(session({
  secret: chaveSegura,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true } 
}))

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

  const isLoggedIn = socket.handshake.query.logged === 'true'

  socket.emit('estadoAtualizado', {
    senhaAtual,
    tipoAtual,
    filaNormal,
    filaPreferencial,
    historicoSenhas
  })

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

  socket.emit('checkLoginStatus', isLoggedIn)

  socket.on('validarLogin', ({ username, password }) => {
    if (username === 'recepcionista' && password === '2025gii') {
      logged = true 

      socket.request.session.loggedIn = true
      socket.request.session.save(() => {
        socket.emit('loginResult', true)
      })
    } else {
      socket.emit('loginResult', false) 
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
