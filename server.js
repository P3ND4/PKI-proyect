const express = require('express');
const { exec } = require('child_process');
const certsRoute = require('./api/routes/certs');
const crypto = require('crypto')
const forge = require('node-forge')
const fs = require('fs');
const pem = require('node-forge/lib/pem');
const app = express();
const selfsigned = require('selfsigned');
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

const initializeCA = () => {// ca-root.js

  const fs = require('fs');

  // Definir los atributos para el certificado (sujeto/emisor)
  const attrs = [
    { name: 'commonName', value: 'Mi CA Root' },
    { name: 'countryName', value: 'CU' },
    { name: 'organizationName', value: 'Mi Empresa' },
    { shortName: 'OU', value: 'Departamento de Seguridad' }
  ];

  // Opciones para la generación del certificado
  const options = {
    algorithm: 'ecdsa',
    days: 3650, // Válido por 10 años (3650 días)
    keyPairOptions: {
      namedCurve: 'prime256v1'
    },
    extensions: [
      // Indicamos que es una CA
      { name: 'basicConstraints', cA: true },
      { name: 'keyUsage', keyCertSign: true, digitalSignature: true, nonRepudiation: true, keyEncipherment: true },
      { name: 'subjectKeyIdentifier' }
    ]
  };

  console.log('Generando CA raíz...');

  // Genera el certificado y las claves (retorna un objeto con las propiedades `private` y `cert`)
  const pems = selfsigned.generate(attrs, options);




  console.log('✅ CA raíz generada en "ca-root.pem".');

  // Guardar la clave privada y el certificado en archivos
  fs.writeFileSync('certs/ca/ca-private.key', pems.private);
  fs.writeFileSync('certs/ca/ca-cert.crt', pems.cert);
  fs.writeFileSync('certs/ca/ca-public.key', pems.public)
  ce = forge.pki.certificateFromPem(pems.cert)
  console.log('Clave privada y certificado raíz de la CA generados.');

}


// Arrancar la aplicación y generar génesis
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
  initializeCA();
  initializeGenesis();
});
