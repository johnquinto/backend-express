const mongoose = require("mongoose");

const testSchema = new mongoose.Schema({
  date: {
    type: Date,
  },
});

const Test = mongoose.model("Test", testSchema);

module.exports = Test;
