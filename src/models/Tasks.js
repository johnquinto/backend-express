const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
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
    status: {
      type: String,
      enum: [
        "Pendente", 
        "Em andamento",
        "Concluída",
        "Atrasada",
        "Cancelada",
        "Suspensa",//6        
      ],
      default: "Pendente",
    },
    dueDate: {
      type: Date,
    },
    priority: {
      type: String,
      enum: ["Alta", "Média", "Baixa"],
    },
    responsible: {
      type: mongoose.Schema.Types.ObjectId, // Assumindo que você está referenciando um usuário
      ref: "User",
    },
    subtasks: {
      type: [
        {
          name: { type: String, required: true }, // Nome da subtarefa
          completed: { type: Boolean, default: false }, // Status da subtarefa
          dueDate: { type: Date }, // Prazo opcional da subtarefa
        },
      ],
    },    
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId, // Referência ao projeto
      ref: "Project",
      required: true,
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId, // Referência ao time
      ref: "Team",
    },
    links: [{
      link:{
        type: String,
        required: true,
      },
    }]
  },
  { timestamps: true }
);

const Task = mongoose.model("Task", taskSchema);
module.exports = Task;
