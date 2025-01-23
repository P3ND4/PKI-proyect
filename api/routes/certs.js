const express = require('express');
const router = express.Router();

const {signCSR, validateCert, rootCert } = require('../controllers/certController');

router.get('/root-ca', rootCert);
router.post('/sign-csr', signCSR);
router.post('/validate-cert', validateCert);


module.exports = router;
