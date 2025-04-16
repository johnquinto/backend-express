const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },  
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  projectId: {type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true},
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
