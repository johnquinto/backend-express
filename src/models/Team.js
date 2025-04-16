const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    // unique: true,
  },
  creator: {
    // Referência ao criador do Team
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  teamCode: { type: String, unique: true, required: true },
  accessCode: { type: String, unique: true, required: true },
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  projects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Project" }],
});

const Team = mongoose.model("Team", teamSchema);
module.exports = Team;
