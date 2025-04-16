const Comment = require('../models/Comment');
const User = require('../models/User'); // Modelo do usuário
const Project = require('../models/Project'); // Modelo do projeto
const Team = require('../models/Team'); // Modelo do time

// Função para criar um comentário
exports.createComment = async (req, res) => {
    const { userId , projectId, teamId } = req.params; // Obtém o userId da URL
    const { content } = req.body;
  
    try {
      // Verifica se o usuário já criou um comentário para este projeto
    //   const existingComment = await Comment.findOne({ author: userId, projectId });
    //   if (existingComment) {
    //     return res.status(400).json({ message: 'Você já criou um comentário para este projeto.' });
    //   }
  
      // Criação do comentário
      const newComment = new Comment({
        content,
        author: userId,
        teamId,
        projectId,
      });
  
      await newComment.save();
      res.status(201).json(newComment);
    } catch (err) {
      res.status(500).json({ message: 'Erro ao criar comentário.', error: err });
    }
  };

// Função para obter comentários de um projeto específico
exports.getComments = async (req, res) => {
    const {projectId , teamId} = req.params
 
    try {
      // Busca todos os comentários associados ao projeto e time
      const comments = await Comment.find({ projectId, teamId })
        .populate('author', 'username') // Popula o campo 'author' para trazer o nome de usuário
        .sort({ createdAt: -1 }); // Ordena por data de criação em ordem decrescente
  
      res.status(200).json(comments);
    } catch (err) {
      res.status(500).json({ message: 'Erro ao obter comentários.', error: err });
    }
  };
  
// Função para editar um comentário
exports.editComment = async (req, res) => {
    const { userId, commentId } = req.params; // Obtém o userId e commentId da URL
    const { content } = req.body;
  
    try {
      // Verifica se o comentário existe e se o autor é o usuário atual
      const comment = await Comment.findById(commentId);
      if (!comment) {
        return res.status(404).json({ message: 'Comentário não encontrado.' });
      }

      const isAdmin = await User.findOne({ _id: userId})

      if (isAdmin.role !== "Administrador") {

        if (comment.author.toString() !== userId.toString()) {
          return res.status(403).json({ message: 'Você não pode editar este comentário.' });
        }
      } 
      // Atualiza o conteúdo do comentário
      comment.content = content;
      comment.updatedAt = Date.now();
  
      await comment.save();
      res.status(200).json(comment);
    } catch (err) {
      res.status(500).json({ message: 'Erro ao editar comentário.', error: err });
    }
  };
  
exports.deleteComment = async (req, res) => {
    const { commentId } = req.params;

    try {
      const comment = await Comment.findById(commentId);
      if (!comment) return res.status(404).json({ message: 'Comentário não encontrado' });
      
      await Comment.findByIdAndDelete(commentId);

      res.status(200).json({ message: 'Comentário excluído com sucesso' });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao excluir comentário', error });
    }
  };