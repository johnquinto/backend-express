const express = require("express");
const bcrypt = require("bcrypt");
// const jwt = require('jsonwebtoken');
const User = require("../models/User");
const Notification = require("../models/Notification");
const Comment = require("../models/Comment");
const Message = require("../models/Message");
const Project = require("../models/Project");
const Task = require("../models/Tasks");
const Team = require("../models/Team");
const Alarm = require("../models/Alarm");

const dayjs = require("dayjs");
const fetch = require('node-fetch'); 

const router = express.Router();

// Rota de login para entrar no Team
router.post("/login", async (req, res) => {
  const { secondUserName, password, accessCode } = req.body;

  // Verificação dos campos obrigatórios
  if (!secondUserName || !password || !accessCode) {
    return res.status(400).json({ message: "Todos os campos são obrigatórios." });
  }

  try {
    // Verificar se secondUserName existe
    const user = await User.findOne({ secondUserName });
    if (!user) {
      return res.status(404).json({ message: "Nome de usuário não encontrado." });
    }

    //Verificar se o access code é valido
    const team = await Team.findOne({ accessCode }).populate("users");
    if (!team){
      return res.status(404).json({ message: "Código de acesso incorreto." })
    }

    const teamEmails = team.users.map((user) => user.email);

    if (!teamEmails.includes(user.email)) {
      const userId = user._id;
      // await User.findByIdAndDelete(userId);
      return res.status(404).json({ message: "Foste removido do Grupo." });
    }
    if (user.spam == true) {
      return res.status(404).json({ message: "Foste removido do Grupo." });
    }

    // Comparar a senha
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Senha incorreta." });
    }

    updateTasksAndProjects(user._id, user.teamId)

    // Retornar dados do usuário e token
    res.status(200).json({
      message: "Login bem-sucedido!",
      user: {
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        secondName: user.secondName,
        secondUserName: user.secondUserName,
        email: user.email,
        teamId: user.teamId,
        role: user.role,
        profileImage: user.profileImage,
        isHighLevelAdmin: user.isHighLevelAdmin,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Erro ao realizar login.", error });
  }
});


const updateTasksAndProjects = async (userId, teamId) =>{

  try {
    // Buscar a data atual na API
    const response = await fetch('https://timeapi.io/api/Time/current/zone?timeZone=Africa/Luanda');
    const data = await response.json();
    const currentDate = dayjs(data.date);

    // const currentDate = dayjs(new Date());

    // Buscar todos os projetos e tarefas em paralelo
    const [projects, tasks] = await Promise.all([
      Project.find({ teamId }),
      Task.find({ teamId })
    ]);

    // Atualizar status de projetos atrasados
    await Promise.all(projects.map(async (project) => {
      if (currentDate.isAfter(dayjs(project.dueDate)) && ['Pendente', 'Em andamento', 'Revisão'].includes(project.status)) {
        await Project.findByIdAndUpdate(project._id, { status: 'Atrasado' });
      }
    }));

    // Verificar status das tarefas
    await Promise.all(tasks.map(async (task) => {
      const project = projects.find(p => p._id.equals(task.project));
      if (!project) return;

      const taskDueDate = dayjs(task.dueDate);
      const projectDueDate = dayjs(project.dueDate);
      const daysDiff = taskDueDate.diff(currentDate, 'day');                        

      if ([10, 5, 2, 1].includes(daysDiff) && ['Pendente', 'Em andamento'].includes(task.status)) {                        
          const newAlarm = new Alarm(
            { 
              alarm: `A tarefa '${task.name}' está a ${daysDiff} dias do prazo de término.`,
              project: task.project,
              task: task._id, 
              teamId: task.teamId, 
              user: task.responsible, 
            });
          const savedAlarm = await newAlarm.save();
        }

      if (currentDate.isAfter(taskDueDate) && ['Pendente', 'Em andamento'].includes(task.status)) {
        await Task.findByIdAndUpdate(task._id, { status: 'Atrasada' });

        const newAlarm = new Alarm(
          { 
            alarm: `A tarefa '${task.name}' está a atrasada.`,
            project: task.project,
            task: task._id, 
            teamId: task.teamId, 
            user: task.responsible, 
          });
        const savedAlarm = await newAlarm.save();
        return
      }

    // await Alarm.deleteMany({task: task._id})
    }));

  } catch (error) {
    console.error('Erro ao atualizar tarefas e projetos:', error);
    socket.emit('error', { message: 'Erro ao processar atualização.', details: error.message });
  }
}

module.exports = router;
