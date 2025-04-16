const express = require("express");
const Task = require("../models/Tasks"); // Importa o modelo de Tarefa
const Project = require("../models/Project"); // Importa o modelo de Tarefa

const router = express.Router();

//Tarefa
router.post("/task", async (req, res) => {
    const { taskId, link } = req.body;

    try {
        const task = await Task.findById(taskId);

        if (!task) {
            return res.status(404).json({ message: "Tarefa não encontrada" });
        }

        task.links.push({ link })

        task.save()

        res.status(200).json({ message: "Link adicionado com sucesso", task });
    } catch (error) {
        res.status(500).json({ message: "Erro ao atualizar a tarefa", error });
    }
});

router.put("/task/:id", async (req, res) => {
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


});

//Projecto

router.post("/project", async (req, res) => {
    const { projectId, link } = req.body;

    try {
        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({ message: "Project não encontrada" });
        }

        project.links.push({ link })

        project.save()

        res.status(200).json({ message: "Link adicionado com sucesso", project });
    } catch (error) {
        res.status(500).json({ message: "Erro ao atualizar a projecto", error });
    }
});

router.put("/project/:id", async (req, res) => {
    const data = req.body;
    try {
        const project = await Project.findById(req.params.id)

        if (!project) {
            return res.status(404).json({ message: "Projecto não encontrada" });
        }

        const updatedProject = await Project.findByIdAndUpdate(
            req.params.id,
            data,
            { new: true }
        );

        res.status(200).json(updatedProject);

    } catch (error) {

        res.status(500).json({ message: "Erro ao atualizar a projecto", error });
    }


});




module.exports = router;
