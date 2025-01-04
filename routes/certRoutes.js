const express = require('express');
const { generateCert, validateCert } = require('../controllers/certController');
const router = express.Router();

// Endpoint para generar un certificado
router.post('/generate', generateCert);

// Endpoint para validar un certificado
router.post('/validate', validateCert);

module.exports = router;
