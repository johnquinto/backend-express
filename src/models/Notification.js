const mongoose = require("mongoose");


const notificationSchema = new mongoose.Schema({
  user:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Referência à model de user
  },

  notification: {
    type: String,
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project", // Referência à model de project
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team", // Referência à model de equipe
  },
  date: { type: Date, default: Date.now },

  timestamp: { type: Date, default: Date.now },
});

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification
