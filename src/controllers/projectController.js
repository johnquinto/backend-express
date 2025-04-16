// controllers/projectController.js
const Project = require('../models/Project'); // Importa o modelo do projeto

// Função para contar projetos de uma equipe específica
exports.countProjectsByTeam = async (req, res) => {
  const { teamId } = req.params;
  try {
    const count = await Project.countDocuments({ teamId });
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao contar projetos', error });
  }
};

exports.getProjectById = async (req, res) => {
  const { projectId } = req.params;
  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Projeto não encontrado' });
    }
    res.json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar o projeto' });
  }
};