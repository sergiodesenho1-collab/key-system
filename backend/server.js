const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

/* ROTAS */
const keyRoutes = require("./routes/keyRoutes");
const authRoutes = require("./routes/authRoutes");

app.use("/keys", keyRoutes);
app.use("/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("🔥 Sistema Portaria SENAC rodando");
});

app.listen(3000, () => {
  console.log("🚀 Server rodando na porta 3000");
});