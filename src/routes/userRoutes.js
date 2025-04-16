// src/routes/userRoutes.js
const express = require("express");
const User = require("../models/User");
const Team = require("../models/Team"); // Importe seu modelo de equipe
const Notification = require("../models/Notification");
const Message = require("../models/Message");
const Comment = require("../models/Comment");
const Task = require("../models/Tasks");
const Project = require("../models/Project");
const Activity = require("../models/Activity");

const bcrypt = require("bcrypt");

const router = express.Router();
const { countUsersByTeam } = require("../controllers/userController");
const Alarm = require("../models/Alarm");

// Rota para obter todos os usuários de uma equipe
router.get("/team/:teamId", async (req, res) => {
  const { teamId } = req.params;

  try {
    // Encontra a equipe pelo ID
    const team = await Team.findById(teamId).populate("users");

    if (!team) {
      return res.status(404).json({ message: "Equipe não encontrada." });
    }

    // Retorna todos os usuários da equipe
    res.status(200).json(team.users);
  } catch (error) {
    console.error("Erro ao buscar usuários da equipe:", error);
    res.status(500).json({ message: "Erro ao buscar usuários da equipe." });
  }
});

// Rota para obter a contagem de usuários por equipe
router.get("/team/:teamId/count", countUsersByTeam);

router.get("/project/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Projeto não encontrado" });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao buscar o projeto" });
  }
});

router.delete("/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario não encontrado" });
    }
    res.status(201).json({ massage: "Usuario Eliminado!!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao buscar o usuario" });
  }
});

router.put("/team/:userId", async (req, res) => {
  const { userId } = req.params;
  const {
    password,
    currentPassword,
    newPassword,
    role,
    email,
    profileImage,
    firstName,
    secondName,
    teamId,
  } = req.body;

  try {

   

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    if(teamId){
    const team = await Team.findById(teamId).populate('users')
    const existingEmails = team.users.map((user) => user.email)
    if(existingEmails.includes(email)){
      return res
      .status(400)
      .json({
        message: "Email já está registrado nesse Grupo.",
      });
    }
  }
    // 1. Valida a senha atual usando bcrypt
    if (currentPassword) {
      const isPasswordCorrect = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!isPasswordCorrect) {
        return res.status(400).json({ message: "Senha atual incorreta." });
      }
    }

    // 2. Atualiza os campos recebidos
    const updatedFields = {};

    if (firstName) {
      const secondName = user.secondName
      updatedFields.username = `${firstName} ${secondName}`
      updatedFields.firstName = firstName
    }

    if (secondName) {
      const firstName = user.firstName
      updatedFields.username = `${firstName} ${secondName}`
      updatedFields.secondName = secondName
    }

    if (secondName && firstName) {
      updatedFields.username = `${firstName} ${secondName}`
      updatedFields.firstName = firstName
      updatedFields.secondName = secondName
    }

    if (newPassword)
      updatedFields.password = await bcrypt.hash(newPassword, 10); // Encripta a nova senha
    if (password) updatedFields.password = await bcrypt.hash(password, 10); // Encripta a nova senha
    if (role) updatedFields.role = role;
    if (email) updatedFields.email = email;
    if (profileImage) updatedFields.profileImage = profileImage;

    // 3. Atualiza o usuário no banco de dados
    const updatedUser = await User.findByIdAndUpdate(userId, updatedFields, {
      new: true,
    });

    return res
      .status(200)
      .json({ message: "Usuário atualizado com sucesso!", updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Erro ao atualizar o usuário." });
  }
});

router.delete("/notification/all/:userId", async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.params.userId });
    res.status(200).json({ message: "Notificações eliminadas com sucesso." });
  } catch (error) {
    console.error("Erro ao eliminar:", error);
    res.status(500).json({ message: "Erro ao eliminar", error });
  }
});

router.delete("/notification/one/:notificationId", async (req, res) => {
  const notificationId = req.params.notificationId;

  try {
    await Notification.findByIdAndDelete(notificationId);
    res.status(200).json({ message: "Notificação eliminada com sucesso." });
  } catch (error) {
    console.error("Erro ao eliminar:", error);
    res.status(500).json({ message: "Erro ao eliminar", error });
  }
});


router.put("/spam/:userId/:adminId", async (req, res) => {
  const { userId } = req.params;
  const { adminId } = req.params;
  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    await Project.updateMany(
      { teamId: user.teamId },
      { $pull: { members: user._id } } // Remove o membro diretamente no banco
    );

    await Team.updateOne(
      { _id: user.teamId },
      { $pull: { users: user._id } } // Remove o membro diretamente no banco
    );

    await Message.deleteMany({ user: userId });
    await Notification.deleteMany({ user: userId });
    await Comment.deleteMany({ author: userId });
    await Task.updateMany({ responsible: userId }, { responsible: adminId });
    await Activity.deleteMany({ responsible: userId });

    user.spam = true;
    user.teamId = null;
    user.save();

    return res
      .status(200)
      .json({ message: "Usuário removido do grupo com sucesso!" });
  } catch (error) {
    res.status(500).json({ message: "Erro ao eliminar usuário." });
  }
});

module.exports = router;
