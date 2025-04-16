// controllers/userController.js
const User = require('../models/User'); // Importa o modelo de usuário

// Função para contar usuários de uma equipe específica
exports.countUsersByTeam = async (req, res) => {
  const { teamId } = req.params;
  try {
    const count = await User.countDocuments({ teamId });
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao contar usuários', error });
  }
};
