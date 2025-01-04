const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./routes/certRoutes');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());

// Rutas
app.use('/api/certs', routes);

// Servidor
app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
});
