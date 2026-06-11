const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.post("/register", (req, res) => {
  const { name, matricula, password } = req.body;

  db.query(
    "INSERT INTO users (name, matricula, password) VALUES (?,?,?)",
    [name, matricula, password],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Usuário criado" });
    }
  );
});

router.get("/users", (req, res) => {
  db.query("SELECT * FROM users", (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

module.exports = router;