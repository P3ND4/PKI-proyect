const express = require('express');
const certRoutes = require('./routes/certs');

const app = express();
app.use(express.json());
app.use('/api/certs', certRoutes);

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
