const mongoose = require("mongoose");

// Esquema de mensagem
const messageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Referência à model de equipe
  },

  message: {
    type: String,
  },

  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team", // Referência à model de equipe
  },
  attachment: {
    type: String
  },

  timestamp: { type: Date, default: Date.now },
});

const Message = mongoose.model("Message", messageSchema);

module.exports = Message
