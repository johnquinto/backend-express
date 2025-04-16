const mongoose = require('mongoose');

const alarmSchema = new mongoose.Schema({
  alarm: {
    type: String, 
    required: true,
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team', 
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  date: {
    type: Date,
    default: Date.now, // Data do alarme
  },
}, { timestamps: true });

const Alarm = mongoose.model('Alarm', alarmSchema);

module.exports = Alarm;
