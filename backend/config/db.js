const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "key_system"
});

db.connect((err) => {
  if (err) {
    console.log("❌ Erro ao conectar MySQL");
  } else {
    console.log("📦 MySQL conectado com sucesso");
  }
});

module.exports = db;