const express = require('express');
const { exec } = require('child_process');
const certsRoute = require('./api/routes/certs');

const app = express();

app.use(express.json());
app.use('/api/certs', certsRoute);

// Función para iniciar el bloque génesis
const initializeGenesis = () => {
  exec('./scripts/startGenesis.sh', (error, stdout, stderr) => {
    if (error) {
      console.error('Error inicializando génesis:', error.message);
      return;
    }
    console.log('Génesis inicializado:', stdout);
  });
};

// Arrancar la aplicación y generar génesis
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
  initializeGenesis();
});
