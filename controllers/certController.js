const forge = require('node-forge');
const fs = require('fs');
const path = require('path');

// Ruta donde se guardarán los certificados
const certDir = path.resolve(__dirname, '../certs');

// Crear certificado X.509
const generateCert = (req, res) => {
    const { commonName, organization } = req.body;

    if (!commonName || !organization) {
        return res.status(400).json({ error: 'Faltan datos obligatorios (commonName, organization)' });
    }

    const pki = forge.pki;

    // Crear par de claves
    const keys = pki.rsa.generateKeyPair(2048);
    const cert = pki.createCertificate();

    // Configurar certificado
    cert.publicKey = keys.publicKey;
    cert.serialNumber = Date.now().toString();
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1); // 1 año de validez

    const attrs = [
        { name: 'commonName', value: commonName },
        { name: 'organizationName', value: organization },
    ];
    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    cert.sign(keys.privateKey);

    // Guardar el certificado
    if (!fs.existsSync(certDir)) fs.mkdirSync(certDir);
    const certPath = path.join(certDir, `${commonName}.crt`);
    const privateKeyPath = path.join(certDir, `${commonName}.key`);

    fs.writeFileSync(certPath, pki.certificateToPem(cert));
    fs.writeFileSync(privateKeyPath, pki.privateKeyToPem(keys.privateKey));

    res.json({
        message: 'Certificado generado con éxito',
        certPath,
        privateKeyPath,
    });
};

// Validar certificado
const validateCert = (req, res) => {
    const { certPem } = req.body;

    if (!certPem) {
        return res.status(400).json({ error: 'Falta el certificado a validar' });
    }

    try {
        const cert = forge.pki.certificateFromPem(certPem);
        const now = new Date();

        if (now < cert.validity.notBefore || now > cert.validity.notAfter) {
            return res.status(400).json({ valid: false, reason: 'Certificado expirado o inválido' });
        }

        res.json({ valid: true });
    } catch (err) {
        res.status(500).json({ error: 'Certificado inválido o corrupto', details: err.message });
    }
};

module.exports = { generateCert, validateCert };
