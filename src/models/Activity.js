const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  activity: {
    type: String, 
    required: true,
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team', 
  },
  responsible: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  date: {
    type: Date,
    default: Date.now, // Data da atividade
  },
}, { timestamps: true });

const Activity = mongoose.model('Activity', activitySchema);

module.exports = Activity;
