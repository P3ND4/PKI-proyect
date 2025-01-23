const express = require('express');
const router = express.Router();

const {signCSR, validateCert } = require('../controllers/certController');


router.post('/sign-csr', signCSR);
router.post('/validate-cert', validateCert);

module.exports = router;
