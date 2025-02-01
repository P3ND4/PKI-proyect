const express = require('express');
const { exec } = require('child_process');
const certsRoute = require('./api/routes/certs');
const crypto = require('crypto')
const forge = require('node-forge')
const fs = require('fs');
const pem = require('node-forge/lib/pem');
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

const pemize = (pem) => {
  var element = '';
  for (let index = 0; index < pem.toString().length; index++) {
    if ((index + 1) % 65 == 0) {
      element += '\n';
      continue;
    }
    element += pem[index];
  }
  return element
}

const initializeCA = () => {
  // Generar la clave privada RSA de la CA
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'P-256' // Usamos la curva P-256
  });
  const privateKeyPem = privateKey.export({ type: 'pkcs8', format: 'pem' });
  const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' });
  // Crear el certificado raíz de la CA
  const csrAttributes = [
    { name: 'commonName', value: 'example.com' },
    { name: 'countryName', value: 'US' },
    { name: 'stateOrProvinceName', value: 'California' },
    { name: 'localityName', value: 'San Francisco' },
    { name: 'organizationName', value: 'Example Org' },
  ];
  const csr = crypto.createSign('SHA256');
  csr.update('dummy message');
  const signature = csr.sign(privateKey);

  // Crear el objeto de firma para el certificado
  const cert = new crypto.X509Certificate();

  // Detalles del certificado
  const certOptions = {
    key: privateKey,         // Clave privada para firmar
    publicKey: publicKey,               // Clave pública asociada
    subject: 'Ca-root', // Nombre del sujeto
    issuer: 'Ca-root',  // El mismo sujeto porque es autofirmado
    notBefore: new Date(),    // Inicio de validez
    notAfter: new Date(),     // Fin de validez
    serialNumber: '01',       // Número de serie
  };
  forge.pki.ed25519.generateKeyPair
  // Configurar fechas del certificado
  certOptions.notAfter.setFullYear(certOptions.notBefore.getFullYear() + 1); // 1 año de validez

  // Firmar el certificado
  const signedCert = crypto.createSelfSignedCertificate(certOptions);
  //const sign = crypto.createSign('SHA256');
  //sign.update(JSON.stringify(cert));  // Firmar el contenido del certificado (en formato texto)
  //const signat = sign.sign(privateKey);  // Firmamos usando la clave privada
  //pemconv = pemize(signat.toString('base64'))

  //const certPem = `-----BEGIN CERTIFICATE-----\n${pemconv}\n-----END CERTIFICATE-----`;


  // Guardar la clave privada y el certificado en archivos
  fs.writeFileSync('certs/ca/ca-private.key', privateKeyPem);
  fs.writeFileSync('certs/ca/ca-cert.crt', signedCert);
  fs.writeFileSync('certs/ca/ca-public.key', publicKeyPem)
  ce = forge.pki.certificateFromPem(certPem)
  console.log('Clave privada y certificado raíz de la CA generados.');

}


// Arrancar la aplicación y generar génesis
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
  initializeCA();
  initializeGenesis();
});
