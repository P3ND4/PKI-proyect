const forge = require('node-forge');
const fs = require('fs');
const path = require('path');
const { error } = require('console');
const { execSync } = require('child_process');
const { name } = require('ejs');

// La CA firma el certificado
const signCSR = (req, res) => {
    const { nombre, csr } = req.body;


    if (!csr) {
        return res.status(400).json({ error: 'csr es obligatorio.' });
    }

    const csrPath = path.join(__dirname, '../../certs/csr/', `${nombre}.csr`);
    const certPath = path.join(__dirname, '../../certs/issued/', `${nombre}.crt`);
    const caCertPath = path.join(__dirname, '../../certs/ca/ca-cert.crt');
    const caKeyPath = path.join(__dirname, '../../certs/ca/ca-private.key');
    const extPath = path.join(__dirname, 'ext.cnf')
    fs.writeFileSync(csrPath, csr, 'utf8')
    const ext = `
[ v3_ext ]  
basicConstraints = CA:FALSE
keyUsage = digitalSignature
extendedKeyUsage = serverAuth,clientAuth
authorityKeyIdentifier = keyid,issuer
subjectAltName = DNS:${nombre}, DNS:localhost, DNS:${nombre}, DNS:localhost
    `
    fs.writeFileSync(extPath, ext)
    try {
        execSync(
            `openssl x509 -req -in ${csrPath} -CA ${caCertPath} -CAkey ${caKeyPath} -CAcreateserial -out ${certPath} -days 365 -sha256 -extfile ${extPath} -extensions v3_ext`
        );


        res.json({ message: 'Certificado firmado con éxito.', cert: fs.readFileSync(certPath, 'utf8') });
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

    var certPath = './certs/ca/ca-cert.crt';

    var cert = fs.readFileSync(certPath, 'utf8');

    try {
        res.json({
            cert: cert
        })
    } catch (err) {
        res.status(500).json({ error: 'Error al solicitar el certificado raiz', details: err })
    }

}




module.exports = { signCSR, validateCert, rootCert }
