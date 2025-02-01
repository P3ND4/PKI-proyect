const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const forge = require("node-forge")

const app = express();
const PORT = 4000;

// Configuración para leer datos del formulario
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configuración de EJS como motor de plantillas
app.set("view engine", "ejs");
app.set("views", __dirname+"/views");

// Ruta para servir el formulario
app.get("/", (req, res) => {
  res.render("forms.ejs"); // Renderiza la vista form.ejs
});

// Ruta para manejar el envío del formulario
app.post("/submit", async (req, res) => {
  const { nombre, organizacion } = req.body;

  try {
    // Cambia la URL por la de tu API
    const response = await axios.post("https://tu-api.com/endpoint", {
      nombre,
      organizacion,
    });

    res.send(`Datos enviados correctamente: ${JSON.stringify(response.data)}`);
  } catch (error) {
    console.error("Error al enviar datos:", error);
    res.status(500).send("Error al enviar datos a la API");
  }
});

// Inicia el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
