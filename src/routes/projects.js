const express = require("express");
const Team = require("../models/Team");
const Project = require("../models/Project");
const Task = require("../models/Tasks");
const Comment = require("../models/Comment");
const supabase = require("../config/supabaseClient");
const { logActivity } = require("../controllers/activityController");
const {countProjectsByTeam , getProjectById} = require("../controllers/projectController");

const fetch = require("node-fetch");
const dayjs = require( "dayjs");
const Notification = require("../models/Notification");

const router = express.Router();

// Rota para criar um novo projeto

router.post("/", async (req, res) => {
  const {
    name,
    description,
    documents,
    members,
    startDate,
    dueDate,
    permissions,
    teamId,
    userName,
    area,
  } = req.body;

  // Verificação dos campos obrigatórios
  if (
    !name ||
    !description ||
    !startDate ||
    !dueDate ||
    !members ||
    !permissions ||
    !area
  ) {
    return res.status(400).json({ message: "Todos os campos são obrigatórios" });
  }

  try {
    // // Buscar a data atual na API
    const response = await fetch('https://timeapi.io/api/Time/current/zone?timeZone=Africa/Luanda');
    const data = await response.json();
    const currentDate = dayjs(data.date); // Formatar a data atual no formato do dayjs

    // Verificar se o startDate é igual à data atual
    if (!startDate || !dayjs(startDate).isSame(currentDate, 'day')) {
      return res.status(400).json({ message: "A data de início deve ser a data atual." });
    }

    // Verificar se o dueDate é maior ou igual ao startDate
    if (dayjs(dueDate).isBefore(startDate, 'day')) {
      return res.status(400).json({ message: "A data de término deve ser maior ou igual à data de início." });
    }

    // Cria um novo projeto com as informações fornecidas
    const project = new Project({
      name,
      description,
      documents,
      startDate: currentDate.format('YYYY-MM-DD'), // Garantir que a startDate seja a data atual
      // startDate,
      dueDate,
      members, // IDs dos membros do projeto
      teamId, // ID da equipe
      permissions,
      area,
    });

    await project.save();

    // Registrar a atividade de criação de projeto
    await logActivity(userName, `Criou o projeto "${name}"`, project._id, teamId);

    res.status(201).json({ message: "Projeto criado com sucesso!", project });
  } catch (error) {
    console.error("Erro ao criar o projeto:", error);
    res.status(500).json({ message: "Erro ao criar o projeto", error });
  }
});


router.post("/docs/:id", async (req, res) => {
  const { name, documentUrl, documentId } = req.body;  // A URL do documento que vem do Filestack  

  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Projeto não encontrado" });
    }

    // Adiciona a URL do arquivo à lista de documentos
    project.documents.push({ name: name, url: documentUrl, handle: documentId });

    // Salva as alterações no projeto
    await project.save();

    res.status(200).json({ message: "Documento adicionado com sucesso", project });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao adicionar o documento" });
  }
});

// Rota para deletar um projeto
router.delete("/:id/:teamId", async (req, res) => {
  const { userName } = req.query;
  const teamId = req.params.teamId
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Projeto não encontrado" });
    }


    // Registrar a atividade de exclusão de projeto
    await logActivity(userName, `Eliminou o projecto "${project.name}"`, null, teamId);

    await Project.findByIdAndDelete(req.params.id);

    // const count = await Task.countDocuments({ teamId });    

    await Task.deleteMany({ project: req.params.id })

    await Comment.deleteMany({ projectId: req.params.id })  

    res.status(200).json({ message: "Projeto excluído com sucesso" });
  } catch (error) {
    res.status(500).json({ message: "Erro ao excluir o projeto", error });
  }
});

// Rota para deletar todos os projetos de um time específico
router.delete("/:id", async (req, res) => {
  const { userName } = req.query;
  const id = req.params.id;

  try {
    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ message: "Grupo não encontrado" });
    }

    // Deletar arquivos relacionados às tarefas
    const tasks = await Task.find({ teamId: id });
    for (const task of tasks) {
      const fileHandles = task.documents.map((doc) => doc.handle);

      // Verificar se há arquivos a serem excluídos
      if (fileHandles.length > 0) {
        const { error } = await supabase.storage
          .from("joaoquinto") // Substitua pelo nome do bucket
          .remove(fileHandles);

        if (error) {
          console.error(`Erro ao excluir arquivos de tarefas:`, error);
          return res.status(500).json({ message: "Erro ao excluir arquivos de tarefas" });
        }
      }
    }

    // Deletar arquivos relacionados aos projetos
    const projects = await Project.find({ teamId: id });
    for (const project of projects) {
      const fileHandles = project.documents.map((doc) => doc.handle);

      // Verificar se há arquivos a serem excluídos
      if (fileHandles.length > 0) {
        const { error } = await supabase.storage
          .from("joaoquinto") // Substitua pelo nome do bucket
          .remove(fileHandles);

        if (error) {
          console.error(`Erro ao excluir arquivos de projetos:`, error);
          return res.status(500).json({ message: "Erro ao excluir arquivos de projetos" });
        }
      }
    }


    // Registrar a atividade de exclusão
    await logActivity(userName, `Eliminou todos os projetos do grupo`, null, id);

    // Deletar todos os registros relacionados no banco
    await Project.deleteMany({ teamId: id });
    await Task.deleteMany({ teamId: id });
    await Comment.deleteMany({ teamId: id });

    res.status(200).json({ message: "Todos os projetos foram excluídos com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir os projetos:", error);
    res.status(500).json({ message: "Erro ao excluir os projetos", error });
  }
});

// Rota para atualizar um projeto
router.put("/:id", async (req, res) => {
  const {
    name,
    description,
    status,
    members,
    permissions,
    dueDate,
    userName,
    teamId,
    documents,
  } = req.body;

  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Projeto não encontrado" });
    }

    // Se `dueDate` estiver presente na requisição, validar com as tarefas associadas
    if (dueDate) {
      const tasks = await Task.find({ project: req.params.id });

      // Verificar se alguma tarefa tem uma dueDate maior que a nova dueDate do projeto
      const isInvalidDueDate = tasks.some((task) => {
        const taskDueDate = new Date(task.dueDate); // Converte a dueDate da tarefa para um objeto Date
        const newProjectDueDate = new Date(dueDate); // Converte a nova dueDate para um objeto Date
        return taskDueDate > newProjectDueDate; // Verifica se a data da tarefa é maior
      });

      if (isInvalidDueDate) {
        return res.status(400).json({
          message:
            "A nova data de conclusão do projeto não pode ser menor que a data de conclusão de uma das tarefas.",
        });
      }
    }

    // Variáveis para armazenar as mensagens de atividade
    let activityMessages = [];

    // Comparando os valores antigos com os novos e gerando mensagens de atividade
    if (name && project.name !== name) {
      activityMessages.push(
        `Atualizou o nome do projeto de "${project.name}" para "${name}"`
      );
    }

    if (description && project.description !== description) {
      activityMessages.push(`Atualizou a descrição do projeto`);
    }

    if (status && project.status !== status) {
      activityMessages.push(`Atualizou o status do projeto para "${status}"`);
    }

    if (dueDate) {
      const oldDueDate = new Date(project.dueDate).toISOString().split("T")[0]; // Formato "YYYY-MM-DD"
      const newDueDate = new Date(dueDate).toISOString().split("T")[0];
      if (oldDueDate !== newDueDate) {
        activityMessages.push(`Atualizou a data de conclusão do projeto`);
      }
    }

    if (JSON.stringify(project.members) !== JSON.stringify(members)) {
      activityMessages.push(`Atualizou os membros do projeto`);
    }

    // Registrar as mensagens de atividade
    if (activityMessages.length > 0) {
      await logActivity(
        userName,
        activityMessages.join(", "),
        project._id,
        teamId
      );
    }

    // Atualiza o projeto com os novos dados
    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      { name, description, status, permissions, members, dueDate, documents },
      { new: true }
    );

    res.status(200).json(updatedProject);
  } catch (error) {
    console.error("Erro ao atualizar o projeto:", error);
    res.status(500).json({ message: "Erro ao atualizar o projeto", error });
  }
});

// Rota para obter todos os projetos de uma equipe
router.get("/team/:teamId", async (req, res) => {
  try {
    const projects = await Project.find({ teamId: req.params.teamId }).populate(
      "members"
    );
    res.status(200).json(projects);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao obter projetos da equipe", error });
  }
});

// Rota para obter a contagem de projetos por equipe
router.get("/team/:teamId/count", countProjectsByTeam);

// Rota para obter um projeto específico pelo ID
router.get("/one/:projectId", getProjectById);

module.exports = router;
