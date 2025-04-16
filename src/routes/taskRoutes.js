const express = require("express");
const Task = require("../models/Tasks"); // Importa o modelo de Tarefa
const Project = require("../models/Project"); // Importa o modelo de Projeto
const router = express.Router();

const dayjs = require("dayjs");

const {
  countTasksByTeam,
  calculateTaskProgress,
  getAllTasks,
} = require("../controllers/taskController");

const { logActivity } = require("../controllers/activityController");

// Rota para criar uma nova tarefa
router.post("/", async (req, res) => {
  const {
    taskName,
    description,
    dueDate,
    priority,
    responsible,
    project,
    status,
    teamId,
    userName,
    subtasks
  } = req.body;

  // console.log(req.body);

  // Verificação dos campos obrigatórios
  if (!taskName || !dueDate || !priority || !responsible || !project) {
    return res
      .status(400)
      .json({ message: "Todos os campos são obrigatórios" });
  }

  try {
    // Verificar se o projeto existe
    const existingProject = await Project.findById(project);
    if (!existingProject) {
      return res.status(404).json({ message: "Projeto não encontrado." });
    }

    // Verificar se a data de conclusão da tarefa está dentro do tempo do projeto
    const projectStartDate = new Date(existingProject.startDate);
    const projectDueDate = new Date(existingProject.dueDate);
    const taskDueDate = new Date(dueDate);

    // Verifique se a data da tarefa está fora do período do projeto
    if (taskDueDate < projectStartDate || taskDueDate > projectDueDate) {
      return res.status(400).json({
        message: `A data de conclusão da tarefa está fora do período do projeto. 
              O projeto vai de "${dayjs(existingProject.startDate).format("DD-MM-YYYY")}" 
              à "${dayjs(existingProject.dueDate).format("DD-MM-YYYY")}"`,
      });
    }

    // Definir o progresso da tarefa com base no status
    let progress = 0;
    if (status === "Concluída") {
      progress = 100;
    } else if (status === "Em andamento") {
      progress = 50;
    }

    // Cria uma nova tarefa com as informações fornecidas
    const task = new Task({
      name: taskName,
      description,
      dueDate,
      priority,
      responsible,
      subtasks,
      project, // ID do projeto ao qual a tarefa pertence
      teamId,
      status,
      progress, // Definindo o progresso inicial com base no status
    });

    await task.save();

    // Registrar a atividade de criação de projeto
    await logActivity(
      userName,
      `Nova tarefa "${taskName}" criada`,
      task.project,
      teamId
    );

    // Atualiza o progresso do projeto após criar a tarefa
    await updateProjectProgress(project);

    res.status(201).json({ message: "Tarefa criada com sucesso!", task });
  } catch (error) {
    res.status(500).json({ message: "Erro ao criar a tarefa", error });
  }
});

// Rota para deletar uma tarefa
router.delete("/:id", async (req, res) => {
  const { userName } = req.query;

  try {
    const task = await Task.findById(req.params.id)
      .populate("teamId", "_id") // Popula apenas o _id do time
      .populate("project", "_id name"); // Popula o projeto, ajustando conforme necessário

    if (!task) {
      return res.status(404).json({ message: "Tarefa não encontrada" });
    }

    const projectId = task.project._id; // Acessa o _id do projeto da tarefa

    // Registra a atividade de exclusão da tarefa
    await logActivity(
      userName,
      `Eliminou a tarefa "${task.name}"`,
      projectId,
      task.teamId._id
    );

    // Exclui a tarefa
    await Task.findByIdAndDelete(req.params.id);

    // Atualiza o progresso do projeto após excluir a tarefa
    await updateProjectProgress(projectId);

    res.status(200).json({ message: "Tarefa excluída com sucesso" });
  } catch (error) {
    res.status(500).json({ message: "Erro ao excluir a tarefa", error });
  }
});

// Rota para atualizar uma tarefa
router.put("/:id", async (req, res) => {
  const {
    name,
    description,
    dueDate,
    priority,
    status,
    userName,
    progress,
    responsible,
    subtasks,
  } = req.body;


  // console.log(req.body);


  try {
    const task = await Task.findById(req.params.id).populate(
      "project",
      "startDate  dueDate"
    );
    if (!task) {
      return res.status(404).json({ message: "Tarefa não encontrada" });
    }

    // Variáveis para armazenar as mensagens de atividade
    let activityMessages = [];

    // Comparando os valores antigos com os novos e gerando mensagens de atividade
    if (task.name !== name) {
      activityMessages.push(
        `Atualizou o nome da Tarefa de "${task.name}" para "${name}"`
      );
    }
    if (task.description !== description) {
      activityMessages.push(`Atualizou a descrição da Tarefa`);
    }
    if (task.status !== status) {
      if (status !== 'Pendente') {
        activityMessages.push(`Atualizou o status da Tarefa "${task.name}" para "${status}"`);
      }
    }
    // Convertendo as datas para o mesmo formato antes de comparar
    const oldDueDate = new Date(task.dueDate).toISOString().split("T")[0]; // Formato "YYYY-MM-DD"
    const newDueDate = new Date(dueDate).toISOString().split("T")[0];
    if (oldDueDate !== newDueDate) {
      activityMessages.push(`Atualizou a data de conclusão da Tarefa`);
    }

    const projectStartDate = new Date(task.project.startDate);
    const projectDueDate = new Date(task.project.dueDate);
    const taskDueDate = new Date(dueDate);

    // Verifique se a data da tarefa está fora do período do projeto
    if (taskDueDate < projectStartDate || taskDueDate > projectDueDate) {
      return res.status(400).json({
        message: `A data de conclusão da tarefa está fora do período do projeto. 
              O projeto vai de "${dayjs(task.project.startDate).format("DD-MM-YYYY")}" 
              à "${dayjs(task.project.dueDate).format("DD-MM-YYYY")}"`,
      });
    }

    // Se houver mensagens de atividade, registre a atividade
    if (activityMessages.length > 0) {
      await logActivity(
        userName,
        activityMessages.join(", "),
        task.project,
        task.teamId
      );
    }

    // Atualizar o progresso da tarefa com base no status
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        dueDate,
        priority,
        status,
        responsible: responsible._id,
        subtasks,
        progress, // Atualizando o progresso com base no novo status
      },
      { new: true }
    );

    // Atualiza o progresso do projeto após editar a tarefa
    await updateProjectProgress(updatedTask.project);

    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: "Erro ao atualizar a tarefa", error });
  }
});

router.put('/:id/docs', async (req, res) => {

  const data = req.body;

  try {
    const task = await Task.findById(req.params.id)

    if (!task) {
      return res.status(404).json({ message: "Tarefa não encontrada" });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      data,
      { new: true }
    );

    res.status(200).json(updatedTask);

  } catch (error) {

    res.status(500).json({ message: "Erro ao atualizar a tarefa", error });
  }
})

// Rota para obter tarefas de um projeto específico
router.get("/:projectId", async (req, res) => {
  try {
    // Verificar se o projeto existe
    const existingProject = await Project.findById(req.params.projectId);
    if (!existingProject) {
      return res.status(404).json({ message: "Projeto não encontrado." });
    }

    const tasks = await Task.find({ project: req.params.projectId })
    // .populate("responsible  project", "name username")
    res.status(200).json(tasks);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao obter tarefas do projeto", error });
  }
});

// Rota para obter uma tarefa específica de um projeto
router.get("/:projectId/tasks/:taskId", async (req, res) => {
  try {
    // Verificar se o projeto existe
    const existingProject = await Project.findById(req.params.projectId);
    if (!existingProject) {
      return res.status(404).json({ message: "Projeto não encontrado." });
    }

    // Verificar se a tarefa existe e pertence ao projeto
    const task = await Task.findOne({
      _id: req.params.taskId,
      project: req.params.projectId,
    }).populate('responsible', 'username')

    if (!task) {
      return res
        .status(404)
        .json({ message: "Tarefa não encontrada no projeto especificado." });
    }

    res.status(200).json(task);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao obter a tarefa do projeto", error });
  }
});

router.get("/:teamId/count", countTasksByTeam);

router.get("/progress/:teamId", calculateTaskProgress);

router.get("/:teamId/total", getAllTasks);

// Atualiza o status de uma tarefa e o progresso do projeto
router.put("/:taskId/status", async (req, res) => {
  const { status, userName } = req.body;

  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: "Tarefa não encontrada." });
    }

    // Atualiza o status da tarefa
    task.status = status;

    // Atualiza o progresso da tarefa com base no novo status
    let progress = 0;
    if (status === "Concluída") {
      progress = 100;
    } else if (status === "Em andamento") {
      progress = 50;
    } else if (
      status === "Atrasada" ||
      status === "Suspensa" ||
      status === "Cancelada"
    ) {
      progress = 0; // Status de bloqueio ou pausado tem progresso 0
    }

    task.progress = progress;

    await logActivity(
      userName,
      `Atualizou o status da Tarefa "${task.name}" para "${status}"`,
      task.project,
      task.teamId
    );

    await task.save();

    // Atualiza o progresso do projeto
    const project = await Project.findById(task.project);
    if (project) {
      await updateProjectProgress(project._id); // Atualiza o progresso do projeto
    }

    res.status(200).json(task);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao atualizar status da tarefa.", error });
  }
});

// Função para atualizar o progresso e o status do projeto com base nas tarefas
const updateProjectProgress = async (projectId) => {
  try {
    // Obtém todas as tarefas do projeto
    const tasks = await Task.find({ project: projectId });

    // Se não houver tarefas, define o progresso como 0 e o status como "Pendente"
    if (tasks.length === 0) {
      await Project.findByIdAndUpdate(projectId, {
        progress: 0,
        status: "Pendente",
      });
      return;
    }

    // Filtra as tarefas que estão "Em andamento" ou "Concluídas"
    const filteredTasks = tasks.filter(
      (task) => task.status === "Em andamento" || task.status === "Concluída" || task.status === "Pendente"
    );

    // Calcula o progresso de cada tarefa com base nas subtarefas
    filteredTasks.forEach((task) => {
      // Conta o número total de subtarefas e as concluídas
      const totalSubtasks = task.subtasks.length;
      const completedSubtasks = task.subtasks.filter((subtask) => subtask.completed).length;

      // Calcula o progresso da tarefa
      const taskProgress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

      // Atualiza o progresso da tarefa
      task.progress = taskProgress;

      // Atualiza o status da tarefa com base no progresso
      if (taskProgress === 100) {
        task.status = "Concluída";
      } else if (taskProgress === 0) {
        task.status = "Pendente";
      } else {
        task.status = "Em andamento";
      }

      // Salva as mudanças no banco de dados
      Task.findByIdAndUpdate(task._id, { progress: taskProgress, status: task.status });
    });

    // Calcula a média dos progressos das tarefas
    const totalProgress = filteredTasks.reduce(
      (sum, task) => sum + task.progress,
      0
    );

    const projectProgress =
      filteredTasks.length > 0 ? totalProgress / filteredTasks.length : 0;

    // Define o status do projeto com base no status das tarefas
    let projectStatus;
    const project = await Project.findById(projectId)


    if (!['Atrasado', 'Revisão', 'Suspenso', 'Cancelado'].includes(project.status)) {

      if (tasks.every((task) => task.status === "Concluída")) {
        projectStatus = project.status == "Concluído" ? "Concluído" : "Revisão"
      } else if (tasks.every((task) => task.status === "Pendente")) {
        projectStatus = "Pendente";
      } else {
        projectStatus = "Em andamento";
      }
    }

    // Atualiza o progresso e o status do projeto
    await Project.findByIdAndUpdate(projectId, {
      progress: Math.floor(projectProgress),
      status: projectStatus,
    });
  } catch (error) {
    console.error("Erro ao atualizar o progresso e o status do projeto", error);
  }
};

module.exports = router;
