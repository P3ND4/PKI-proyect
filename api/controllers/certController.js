const forge = require('node-forge');
const fs = require('fs');
const path = require('path');
const { error } = require('console');


// La CA firma el certificado
const signCSR = (req, res) => {
    const { csr } = req.body;
    forge.pki.certificationRequestToPem(csr)

    if (!csrName) {
        return res.status(400).json({ error: 'csrName es obligatorio.' });
    }

    const csrPath = path.join(__dirname, '../../certs/csr/', csrName);
    const certPath = path.join(__dirname, '../../certs/issued/', `${csrName.replace('.csr', '.crt')}`);
    const caCertPath = path.join(__dirname, '../../certs/ca/ca.crt');
    const caKeyPath = path.join(__dirname, '../../certs/ca/ca.key');

    try {
        execSync(
            `openssl x509 -req -in ${csrPath} -CA ${caCertPath} -CAkey ${caKeyPath} -CAcreateserial -out ${certPath} -days 365 -sha256`
        );

        res.json({ message: 'Certificado firmado con éxito.', certPath });
    } catch (err) {
        res.status(500).json({ error: 'Error al firmar el CSR.', details: err.message });
    }
};


// Validar certificado
const validateCert = (req, res) => {
    const { certName } = req.body;

    if (!certName) {
        return res.status(400).json({ error: 'certName es obligatorio.' });
    }

    const certPath = path.join(__dirname, '../../certs/issued/', certName);
    const caCertPath = path.join(__dirname, '../../certs/ca/ca-cert.crt');

    try {
        execSync(`openssl verify -CAfile ${caCertPath} ${certPath}`);
        res.json({ message: 'Certificado válido.' });
    } catch (err) {
        res.status(400).json({ error: 'Certificado no válido.', details: err.message });
    }
};

// Certificado de la CA de la PKI
const rootCert = (req, res) => {
    certPath = '../../certs/ca/ca-cert.crt'
    rootCAcert = forge.pki.certificateFromPem(certPath)
    try{
        res.json({
            cert: rootCAcert
        })
    }catch (err){
        res.status(500).json({error: 'Error al solicitar el certificado raiz', details: err})
    }

}




module.exports = {signCSR, validateCert, rootCert}
