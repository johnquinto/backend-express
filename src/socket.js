const Message = require('./models/Message'); // Modelo de mensagens
const Notification = require('./models/Notification'); // Modelo de notificações
const Project = require('./models/Project'); // Modelo de projectos
const Task = require('./models/Tasks'); // Modelo de tarefas
const Alarm = require('./models/Alarm'); 
const dayjs = require("dayjs");
const fetch = require('node-fetch');

// Objeto para mapear userId -> socket.id
const connectedUsers = {};

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('Novo usuário conectado:', socket.id);

    /**
     * Registrar o userId para o socket conectado
     */
    socket.on('register', (userId) => {
      if (userId) {
        connectedUsers[userId] = socket.id;
        console.log(`Usuário ${userId} registrado com o socket ${socket.id}`);
      }
    });

    /**
     * Evento 1: Carregar mensagens de uma equipe
     */
    socket.on('joinTeam', async (teamId) => {
      if (!teamId) {
        console.error('Team ID não fornecido.');
        return socket.emit('error', { message: 'Team ID é obrigatório.' });
      }

      // Carregar mensagens para a equipe
      Message.find({ teamId })
        .populate('user', 'username profileImage') // Popula o campo 'user'
        .sort({ timestamp: 1 }) // Ordena por timestamp
        .then((messages) => {
          socket.emit('loadMessages', messages); // Envia as mensagens para o cliente
        })
        .catch((err) => {
          console.error('Erro ao carregar mensagens:', err);
          socket.emit('error', { message: 'Erro ao carregar mensagens.' });
        });


      // Adicionar o usuário à sala da equipe
      socket.join(teamId);
      console.log(`Usuário entrou na sala da equipe ${teamId}.`);
    });

    /**
     * Enviar uma nova mensagem para uma equipe
     */
    socket.on('sendMessage', (data) => {
      const { user, message, teamId, attachment } = data;
      const newMessage = new Message({ user, message, teamId, attachment });
      newMessage.save()
        .then((savedMessage) => savedMessage.populate('user', 'username profileImage')) // Popula o nome do usuário
        .then((populatedMessage) => {
          // Emite a mensagem apenas para os usuários conectados na sala específica do time
          io.to(teamId).emit('receiveMessage', populatedMessage);
        })
        .catch((err) => console.error('Erro ao salvar mensagem:', err));
    });


    // socket.on('updateTasksAndProjects', async (userId, teamId) => {
    //   if (!userId) {
    //     console.error('User ID não fornecido.');
    //     return socket.emit('error', { message: 'User ID é obrigatório.' });
    //   }

    //   try {
    //     // Buscar a data atual na API
    //     // const response = await fetch('https://timeapi.io/api/Time/current/zone?timeZone=Africa/Luanda');
    //     // const data = await response.json();
    //     // const currentDate = dayjs(data.date);

    //     const currentDate = dayjs(new Date());

    //     // Buscar todos os projetos e tarefas em paralelo
    //     const [projects, tasks] = await Promise.all([
    //       Project.find({ teamId }),
    //       Task.find({ teamId })
    //     ]);

    //     // Atualizar status de projetos atrasados
    //     await Promise.all(projects.map(async (project) => {
    //       if (currentDate.isAfter(dayjs(project.dueDate)) && project.status !== "Concluído") {
    //         await Project.findByIdAndUpdate(project._id, { status: 'Atrasado' });
    //       }
    //     }));

    //     // Verificar status das tarefas
    //     await Promise.all(tasks.map(async (task) => {
    //       const project = projects.find(p => p._id.equals(task.project));
    //       if (!project) return;

    //       const taskDueDate = dayjs(task.dueDate);
    //       const projectDueDate = dayjs(project.dueDate);
    //       const daysDiff = projectDueDate.diff(taskDueDate, 'day');

    //       if ([10, 5, 3, 2].includes(daysDiff) && ['Pendente', 'Em andamento'].includes(task.status)) {                        
                                          
    //           const newAlarm = new Alarm(
    //             { 
    //               alarm: `A tarefa '${task.name}' está a ${daysDiff} dias do prazo do projeto.`,
    //               project: task.project,
    //               task: task._id, 
    //               teamId: task.teamId, 
    //               user: task.responsible, 
    //             });
    //           const savedAlarm = await newAlarm.save();
    //         }

    //       if (currentDate.isAfter(taskDueDate) && task.status !== "Concluída") {
    //         await Task.findByIdAndUpdate(task._id, { status: 'Atrasada' });
    //       }
    //     }));

    //   } catch (error) {
    //     console.error('Erro ao atualizar tarefas e projetos:', error);
    //     socket.emit('error', { message: 'Erro ao processar atualização.', details: error.message });
    //   }
    // });
    /**
     * Evento 2: Carregar notificações de um usuário
     */
    socket.on('loadUserNotifications', (userId) => {
      if (!userId) {
        console.error('User ID não fornecido.');
        return socket.emit('error', { message: 'User ID é obrigatório.' });
      }

      // Carregar notificações para o usuário
      Notification.find({ user: userId })
        .populate('user project', 'username name permissions') // Popula os campos necessários
        .sort({ timestamp: 1 }) // Ordena por timestamp
        .then((notifications) => {

          socket.emit('loadNotifications', notifications); // Envia as notificações ao cliente
        })
        .catch((err) => {
          console.error('Erro ao carregar notificações:', err);
          socket.emit('error', { message: 'Erro ao carregar notificações.' });
        });
    });

    /**
     * Enviar uma nova notificação para usuários específicos
     */
    socket.on('sendNotification', async (data) => {
      const { users, notification, project, teamId } = data;
      try {
        for (const user of users) {
          // Criação e salvamento da notificação
          const newNotification = new Notification({ user, notification, project, teamId });
          const savedNotification = await newNotification.save();

          // Populando os campos necessários
          const populatedNotification = await savedNotification.populate('user project', 'username name permissions');

          // Verifica se o usuário está conectado
          const socketId = connectedUsers[user];
          if (socketId) {
            io.to(socketId).emit('receiveNotification', populatedNotification);
          }
        }
      } catch (err) {
        console.error('Erro ao salvar notificação:', err);
      }
    });

    /** 
     * Evento para notificar num usuário que foi removido do grupo
    */

    socket.on('sendUserRemoved', (user) => {

      // Verifica se o usuário está conectado
      const socketId = connectedUsers[user];
      if (socketId) {
        io.to(socketId).emit('receiveUserRemoved', "Foste Removido do grupo");
      }

    })

    /**
     * Evento de desconexão
     */
    socket.on('disconnect', () => {
      console.log('Usuário desconectado:', socket.id);

      // Remover o userId associado ao socket desconectado
      const userId = Object.keys(connectedUsers).find(key => connectedUsers[key] === socket.id);
      if (userId) {
        delete connectedUsers[userId];
        console.log(`Usuário ${userId} removido da lista de conectados.`);
      }
    });
  });
};
