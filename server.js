const express = require('express');
const { exec } = require('child_process');
const certsRoute = require('./api/routes/certs');
const forge = require('node-forge')
const fs = require('fs')
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

const initializeCA = () => {
  // Generar la clave privada RSA de la CA
  const { privateKey, publicKey } = forge.pki.rsa.generateKeyPair(2048);
  const privateKeyPem = forge.pki.privateKeyToPem(privateKey);
  const publicKeyPem = forge.pki.publicKeyToPem(publicKey)
  // Crear el certificado raíz de la CA
  const cert = forge.pki.createCertificate();
  cert.publicKey = publicKey;
  cert.serialNumber = '01';
  cert.validFrom = new Date();
  cert.validTo = new Date();
  cert.validTo.setFullYear(cert.validFrom.getFullYear() + 10);

  cert.setSubject([
    { name: 'commonName', value: 'PKI-CA' },
    { name: 'organizationName', value: 'MATCOM' },
    { name: 'countryName', value: 'CU' }
  ]);

  cert.sign(privateKey, forge.md.sha256.create());
  const certPem = forge.pki.certificateToPem(cert);

  // Guardar la clave privada y el certificado en archivos
  fs.writeFileSync('certs/ca/ca-private.key', privateKeyPem);
  fs.writeFileSync('certs/ca/ca-cert.crt', certPem);
  fs.writeFileSync('certs/ca/ca-public.key', publicKeyPem)

  console.log('Clave privada y certificado raíz de la CA generados.');

}


// Arrancar la aplicación y generar génesis
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
  initializeCA();
  initializeGenesis();
});
