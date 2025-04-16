const Task = require("../models/Tasks"); // Importa o modelo de usuário

// Função para contar usuários de uma equipe específica
exports.countTasksByTeam = async (req, res) => {
  const { teamId } = req.params;
  try {
    const count = await Task.countDocuments({ teamId });
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ message: "Erro ao contar usuários", error });
  }
};

exports.calculateTaskProgress = async (req, res) => {
  const { teamId } = req.params;

  try {
    const tasks = await Task.find({ teamId });

    const totalTasks = tasks.length;
    const totalProgress = tasks.reduce((acc, task) => acc + task.progress, 0);
    const averageProgress = totalTasks > 0 ? totalProgress / totalTasks : 0;

    const progress = Math.floor(averageProgress);

    res.status(200).json({ progress });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao calcular o progresso das tarefas", error });
  }
};

exports.getAllTasks = async (req, res) => {
  const { teamId } = req.params;

  try {
    const tasks = await Task.find({ teamId }).populate("responsible  project", "username name status permissions")
    ;

    if (!tasks) {
      res.status(204).json({ massage: "Erro team não encontrado " });
    }

    res.status(201).json({ tasks });
  } catch (error) {
    res.status(500).json({ message: " Erro ao buscar total de tarefas" });
  }
};
