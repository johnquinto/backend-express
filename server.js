const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const axios = require('axios'); // <- usado pra ping

require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Conectar ao MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB conectado com sucesso');
  })
  .catch((err) => {
    console.error('Erro ao conectar ao MongoDB:', err);
  });

// Importar e usar as rotas
const authRoutes = require('./src/routes/auth');
app.use('/api/auth', authRoutes);

const teamRoutes = require('./src/routes/team');
app.use('/api/teams', teamRoutes);

const projectsRoutes = require('./src/routes/projects');
app.use('/api/projects', projectsRoutes);

const userRoutes = require('./src/routes/userRoutes');
app.use('/api/users', userRoutes);

const test = require('./src/routes/test');
app.use('/api/tests', test);

const taskRoutes = require('./src/routes/taskRoutes');
app.use('/api/tasks', taskRoutes);

const linksRoutes = require('./src/routes/linksRoutes');
app.use('/api/links', linksRoutes);

const commentRoutes = require('./src/routes/commentRoutes');
app.use('/api/comments', commentRoutes);

// Rota padrão
app.get('/', (req, res) => {
  res.send('Backend rodando');
});

// Configuração do Socket.io
require('./src/socket')(io);

// Pingar o frontend periodicamente
const FRONTEND_URL = 'https://frontend-react-mxin.onrender.com';

setInterval(async () => {
  try {
    const res = await axios.get(FRONTEND_URL);
    console.log(`[PING] Frontend acordado: ${res.status} - ${new Date().toISOString()}`);
  } catch (err) {
    console.log(`[PING] Erro ao pingar frontend: ${err.message}`);
  }
}, 1000 * 60 * 5); // a cada 5 minutos

// Pingar o App B periodicamente
const APP_B_URL = 'https://app-b-pinger-ljzb.onrender.com';

setInterval(async () => {
  try {
    const res = await axios.get(APP_B_URL);
    console.log(`[PING] App B acordado: ${res.status} - ${new Date().toISOString()}`);
  } catch (err) {
    console.log(`[PING] Erro ao pingar App B: ${err.message}`);
  }
}, 1000 * 60 * 5); // a cada 5 minutos

// Iniciar servidor
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
