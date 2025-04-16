const express = require("express");
const Test = require("../models/Test");

const router = express.Router();

router.post("/", async (req, res) => {
  const { date } = req.body;

  if (!date) {
    return res.status(400).json({ message: "Campo obrigatório" });
  }
  try {


    const count = await Test.countDocuments()

    if (count == 1) {
        
       return res.json({message: "Está Cheio"})
    }


    const test = new Test({
      date,
    });

    await test.save();
    5;
    res.status(201).json({ message: "Salvo com sucesso", test });
  } catch (error) {
    res.status(500).json({ message: "Erro ao salvar", error });
  }
});

router.get("/", async (req, res) => {
  try {
    const test = await Test.find();

    if (!test) {
      return res.status(404).json({ message: "Não encontrado." });
    }

    res.status(200).json({test});
  } catch (error) {
    res.status(500).json({ message: "Erro ao obter", error });
  }
});

router.put("/:id", async (req, res) => {
  const { date } = req.body;
  const { id } = req.params;

  if (!date) {
    return res.status(400).json({ message: "Campo obrigatório." });
  }
  try {
    const test = await Test.findById(id);
    if (!test) {
      return res.status(404).json({ message: "Não encontrado." });
    }

    const updatedTest = await Project.findByIdAndUpdate(
      id,
      { date },
      { new: true }
    );

    res.status(200).json({ message: "Atualizado com sucesso", updatedTest });
  } catch (error) {
    res.status(500).json({ message: "Erro ao salvar", error });
  }
});

module.exports = router;
