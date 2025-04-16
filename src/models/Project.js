const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  documents: [{
    name: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    handle:{
      type: String,
      required: true,
    },
  }],
  startDate: {
    type: Date,
    required: true,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Referência à model de usuário
  }],
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team', // Referência à model de equipe
  },
  permissions: {
    type: String,
    enum: ['all', 'team', 'read'], // Níveis de acesso permitidos
    required: true,
  },
  area:{
    type: String,
  },
  status: {
    type: String,
    enum: [
      'Pendente', // Aguarda o início
      'Em andamento', // Projeto em execução
      'Concluído', // Projeto finalizado com sucesso
      'Revisão', // Status incerto, aguardando confirmação
      'Suspenso', // Temporariamente pausado
      'Atrasado', // Atrasado em relação à data prevista
      'Cancelado' // Cancelado por motivos diversos
    ],
    default: 'Pendente'
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
    validate: {
      validator: Number.isInteger,
      message: 'O progresso deve ser um número inteiro entre 0 e 100.'
    }
  },
  links: [{
    link:{
      type: String,
      required: true,
    },
  }]
}, { timestamps: true });

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
