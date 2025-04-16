const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Team = require("../models/Team");
const Activity = require("../models/Activity");
const Project = require("../models/Project");
const Task = require("../models/Tasks");
const Comment = require("../models/Comment");
const Message = require("../models/Message");
const Alarm = require("../models/Alarm");
const supabase = require("../config/supabaseClient");
const Notification = require("../models/Notification");
const { logActivity } = require("../controllers/activityController");

async function loadNanoid() {
  const { customAlphabet } = await import("nanoid");
  const generateTeamId = customAlphabet(
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
    9
  );
  return () =>
    `${generateTeamId().slice(0, 3)}-${generateTeamId().slice(3, 6)}-${generateTeamId().slice(6)}`;
}

router.post("/create", async (req, res) => {
  const {firstName, secondName , secondUserName , email, password, teamName, } = req.body;
  try {
    const createFormattedTeamId = await loadNanoid();
    const createFormattedAccessCode = await loadNanoid();
    const username = `${firstName} ${secondName}`

    // Verificar se o secondUserName já está registrado
    const existingUser = await User.findOne({ secondUserName });
    if (existingUser) {
      return res
        .status(400)
        .json({
          message: "Nome de usuário já registrado.",
        });
    }
    
    // Criação do usuário (criador)
    const creator = new User({
      username,
      secondUserName,
      firstName,
      secondName,
      email,
      password,
      role: "Administrador",
      isHighLevelAdmin: true,
    });
    await creator.save();

    // Criação do time com ID formatado e criador como referência
    const team = new Team({
      teamCode: createFormattedTeamId(),
      accessCode: createFormattedAccessCode(),
      name: teamName,
      creator: creator._id,
      users: creator._id,
    });
    await team.save();

    // Atualizando o usuário com o ID do time
    creator.teamId = team._id;
    await creator.save();


    res.status(201).json({
      message: "Grupo criado com sucesso!",
      user: {
        id: creator._id,
        username: creator.username,
        firstName: creator.firstName,
        secondName: creator.secondName,
        email: creator.email,
        teamId: team._id,
        role: creator.role,
        profileImage: creator.profileImage,
        isHighLevelAdmin: creator.isHighLevelAdmin,
      },
    });
  } catch (error) {
    console.error("Erro ao criar time:", error);
    res
      .status(500)
      .json({ message: "Erro ao criar time.", error: error.message });
  }
});

router.post("/join", async (req, res) => {
  const {teamId , firstName, secondName , secondUserName, email, password } = req.body;
  const username = `${firstName} ${secondName}`

  try {
    // Verificação se o Grupo existe
    const team = await Team.findById(teamId).populate('users')
    if (!team) {
      return res.status(404).json({ message: "Grupo não encontrado." });
    }

    // Verificar se o secondUserName já está registrado
    const existingSecondUserName = await User.findOne({ secondUserName });
    if (existingSecondUserName) {
      return res
        .status(400)
        .json({
          message: "Nome de usuário já registrado.",
        });
    }

    //Verificar se o email já está registrado nesse grupo
    const existingEmails = team.users.map((user) => user.email)
    if(existingEmails.includes(email)){
      return res
      .status(400)
      .json({
        message: "Email já está registrado nesse Grupo.",
      });
    }

    // Criação do novo usuário e associação ao Grupo
    const user = new User({
      username: username,
      firstName,
      secondName,
      secondUserName,
      email,
      password,
      teamId: team._id,
      isHighLevelAdmin: false,
    });

    await user.save();

    // Atualizar o array de usuários do Grupo com o novo usuário
    team.users.push(user._id);
    await team.save();

        // Registrar a atividade de criação de projeto
    await logActivity(user._id, `Juntou-se ao grupo`, null, user.teamId);

    res.status(201).json({
      message: "Você se juntou ao Grupo. Seja bem vindo!",
      user: {
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        secondName: user.secondName,
        teamId: user.teamId,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        isHighLevelAdmin: user.isHighLevelAdmin,

      },
    });
  } catch (error) {
    console.error("Erro ao unir-se ao Grupo:", error); // Log do erro
    res
      .status(500)
      .json({ message: "Erro ao unir-se ao Grupo.", error: error.message });
  }
});

router.get("/check/:teamCode", async (req, res)=>{

  const teamCode = req.params.teamCode
  try {

    const team = await Team.findOne({teamCode})

    if(!team){
      return res.status(404).json({message: "ID do grupo inválido. Não existe um grupo com esse ID."})
    }


    return res.status(200).json(team)
    
  } catch (error) {
    console.error("Erro ao buscar Grupo.", error);
    res.status(500).json({ message: "Erro ao buscar buscar Grupo." });
  }


})

router.get("/info/:teamId", async (req, res) => {
  const { teamId } = req.params;

  try {
    // Encontra a equipe pelo ID
    const team = await Team.findById(teamId).populate("users");

    if (!team) {
      return res.status(404).json({ message: "Equipe não encontrada." });
    }

    // Retorna todos os dados da equipe
    res.status(200).json(team);
  } catch (error) {
    console.error("Erro ao buscar dados da equipe:", error);
    res.status(500).json({ message: "Erro ao buscar dados da equipe." });
  }
});

router.put("/update/:teamId", async (req, res) => {
  const { teamId } = req.params;
  const { newName } = req.body;

  try {
    // Encontra a equipe pelo ID
    const team = await Team.findById(teamId);

    if (!team) {
      return res.status(404).json({ message: "Equipe não encontrada." });
    }

    // Atualiza o nome da equipe
    team.name = newName;

    // Salva a equipe atualizada
    await team.save();

    // Retorna a equipe atualizada
    res.status(200).json(team);
  } catch (error) {
    console.error("Erro ao atualizar o nome da equipe:", error);
    res.status(500).json({ message: "Erro ao atualizar o nome da equipe." });
  }
});

router.get("/activity/:teamId", async (req, res) => {
  const { teamId } = req.params;

  try {
    // Encontra a equipa pelo ID
    const team = await Team.findById(teamId).populate("users");

    if (!team) {
      return res.status(404).json({ message: "Team não encontrado." });
    }

    // Aqui usamos o populate para incluir as informações do projeto em cada atividade
    const activity = await Activity.find({ teamId })
      .populate("project responsible", "name username role") // Popula o campo 'project' com o campo 'name' do projeto

    // Modifica a data de cada atividade individualmente
    const formattedActivity = activity.map(item => ({
      ...item.toObject(), // Converte o documento Mongoose para um objeto simples
      date: new Date(item.date).toISOString().split("T")[0], // Formata a data
      projectName: item.project ? item.project.name : 'Sem projeto', // Adiciona o nome do projeto
      project: item.project ? item.project._id : 'Sem projeto', // Adiciona o nome do projeto
    }));

    // Retorna todas as atividades com a data formatada e nome do projeto
    res.status(200).json(formattedActivity);

  } catch (error) {
    console.error("Erro ao buscar atividades da equipa:", error);
    res.status(500).json({ message: "Erro ao buscar atividades da equipa." });
  }
});

router.delete("/activity/:teamId", async (req, res) => {
  const { teamId } = req.params;
  const { values } = req.query; // Obtém os meses enviados no parâmetro da consulta

  // Se nenhum mês for especificado, exclui todas as atividades do time
  if (!values) {
    try {
      const result = await Activity.deleteMany({ teamId }); // Aguarda a exclusão
      return res.status(200).json({
        message: "Todas as atividades excluídas com sucesso!",
        result,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Erro ao excluir atividades.", error });
    }
  }

  try {
    const months = values.value
    // Formatar os meses em intervalos de datas
    const datesToDelete = months.map((month) => {
      const [monthName, year] = month.split("/"); // Exemplo: "Janeiro/2024"
      const monthIndex = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
      ].indexOf(monthName);

      if (monthIndex === -1) {
        throw new Error(`Mês inválido: ${month}`);
      }

      return {
        start: new Date(year, monthIndex, 1), // Primeiro dia do mês
        end: new Date(year, monthIndex + 1, 0, 23, 59, 59), // Último dia do mês
      };
    });

    // Executa exclusão para cada intervalo de mês
    const deletePromises = datesToDelete.map(({ start, end }) =>
      Activity.deleteMany({
        teamId,
        date: { $gte: start, $lte: end }, // Filtra pelo intervalo do mês
      })
    );

    const results = await Promise.all(deletePromises); // Aguarda todas as exclusões

    res.status(200).json({
      message: "Atividades dos meses selecionados excluídas com sucesso!",
      results,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao excluir atividades.", error });
  }

});

router.delete("/:id", async (req, res) => {
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

      if (fileHandles.length > 0) {
        const { error } = await supabase.storage
          .from("joaoquinto")
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

      if (fileHandles.length > 0) {
        const { error } = await supabase.storage
          .from("joaoquinto")
          .remove(fileHandles);

        if (error) {
          console.error(`Erro ao excluir arquivos de projetos:`, error);
          return res.status(500).json({ message: "Erro ao excluir arquivos de projetos" });
        }
      }
    }

    // Deletar arquivos relacionados aos usuários
    const users = await User.find({ teamId: id });
    for (const user of users) {
      const url = user.profileImage;

      if (url && url.includes("joaoquinto/")) {
        const handle = url.split("joaoquinto/")[1];

        if (handle) {
          const { error } = await supabase.storage
            .from("joaoquinto")
            .remove([handle]);

          if (error) {
            console.error(`Erro ao excluir foto de perfil:`, error);
            return res.status(500).json({ message: "Erro ao excluir foto de perfil" });
          }
        }
      }
    }

    // Deletar todos os registros relacionados no banco
    await Project.deleteMany({ teamId: id });
    await Task.deleteMany({ teamId: id });
    await Comment.deleteMany({ teamId: id });
    await Activity.deleteMany({ teamId: id });
    await Message.deleteMany({ teamId: id });
    await Notification.deleteMany({teamId: id});
    await User.deleteMany({ teamId: id });
    await Team.findByIdAndDelete(id);

    res.status(200).json({ message: "Grupo eliminado com sucesso." });

  } catch (error) {
    console.error("Erro ao eliminar:", error);
    res.status(500).json({ message: "Erro ao eliminar", error });
  }
});

router.get("/alarm/:userId", async (req, res)=>{
  const userId = req.params.userId
  try {
    const alarms = await Alarm.find({user: userId}).populate("project task") 
    
    return res.status(200).json(alarms)


  } catch (error) {
    console.log(error)
    return res.status(500).json({message: "Erro ao buscar alarmes."})
  }
})

router.delete("/alarm/:userId", async (req, res) => {
  try {
    await Alarm.deleteMany({ user: req.params.userId });
    res.status(200).json({ message: "Alertas eliminadas com sucesso." });
  } catch (error) {
    console.error("Erro ao eliminar:", error);
    res.status(500).json({ message: "Erro ao eliminar", error });
  }
});

module.exports = router;
