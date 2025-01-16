const forge = require('node-forge');
const fs = require('fs');
const path = require('path');

const generateCSR = (req, res) => {
    const { commonName, organization, publicKey } = req.body;

    console.log("Received data:", req.body);  // Ver qué datos recibimos

    if (!commonName || !organization) {
        return res.status(400).json({ error: 'commonName y organization son obligatorios.' });
    }

    const publicKeyPath = path.join(__dirname, '../../certs/public/', `${commonName}.key`);
    const csrPath = path.join(__dirname, '../../certs/csr/', `${commonName}.csr`);

    console.log("Public key path:", publicKeyPath);  // Ver la ruta de la clave privada
    console.log("CSR path:", csrPath);  // Ver la ruta del CSR

    try {
        // Guardar la clave publica
        fs.writeFileSync(publicKeyPath, forge.pki.publicKeyToPem(publicKey));

        // Crear el objeto CSR
        const csr = forge.pki.createCertificationRequest();
        csr.publicKey = publicKey;

        // Establecer los atributos del sujeto del CSR
        csr.setSubject([
            {
                name: 'commonName',
                value: commonName
            },
            {
                name: 'organizationName',
                value: organization
            },
            {
                name: 'countryName',
                value: 'US'  // Agregar un atributo común adicional
            },
            {
                name: 'localityName',
                value: 'Some City'  // Agregar otro atributo
            }
        ]);

        // Firmar el CSR con la clave privada generada
        csr.sign(privateKey.privateKey);

        console.log("CSR object:", csr);  // Ver el CSR antes de convertirlo a PEM

        // Intentar convertir el CSR a formato PEM
        const pemCSR = forge.pki.certificationRequestToPem(csr);
        console.log("PEM CSR:", pemCSR);  // Ver el CSR en formato PEM

        // Guardar el CSR en un archivo
        fs.writeFileSync(csrPath, pemCSR);

        res.json({ message: 'CSR generado con éxito, ahora envíalo a la CA para su firma.', csrPath });
    } catch (err) {
        console.error("Error generando CSR:", err);  // Log de error
        res.status(500).json({ error: 'Error generando CSR.', details: err.message });
    }
};



// La CA firma el certificado
const signCSR = (req, res) => {
    const { csrName } = req.body;

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
    const caCertPath = path.join(__dirname, '../../certs/ca/ca.crt');

    try {
        execSync(`openssl verify -CAfile ${caCertPath} ${certPath}`);
        res.json({ message: 'Certificado válido.' });
    } catch (err) {
        res.status(400).json({ error: 'Certificado no válido.', details: err.message });
    }
};




module.exports = {generateCSR, signCSR, validateCert}
