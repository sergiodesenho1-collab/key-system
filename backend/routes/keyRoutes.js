const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.post("/take", (req, res) => {
  const { user_id, key_name } = req.body;

  db.query(
    "INSERT INTO keys_log (user_id, key_name, action) VALUES (?,?,?)",
    [user_id, key_name, "RETIRADA"],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Chave retirada" });
    }
  );
});

router.post("/return", (req, res) => {
  const { user_id, key_name } = req.body;

  db.query(
    "INSERT INTO keys_log (user_id, key_name, action) VALUES (?,?,?)",
    [user_id, key_name, "DEVOLUCAO"],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Chave devolvida" });
    }
  );
});

router.get("/history", (req, res) => {
  db.query("SELECT * FROM keys_log ORDER BY id DESC", (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

module.exports = router;