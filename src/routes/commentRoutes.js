const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');

// Rota para criar um comentário
router.post('/:userId/:projectId/:teamId', commentController.createComment);

// Rota para editar um comentário
router.put('/:userId/:commentId', commentController.editComment);

// Rota para obter comentários de um projeto específico
router.get('/:projectId/:teamId', commentController.getComments);

// Rota para eliminar um comentário
router.delete('/:commentId', commentController.deleteComment);

module.exports = router;
