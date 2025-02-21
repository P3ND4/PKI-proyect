const express = require('express');
const { exec } = require('child_process');
const crypto = require('crypto')
const forge = require('node-forge')
const fs = require('fs');
const pem = require('node-forge/lib/pem');
const app = express();
const selfsigned = require('selfsigned');
const path = require('path')
const {execSync} = require('child_process') 


const certsRoute = require('./api/routes/certs.js');
app.use(express.json());
app.use('/', certsRoute);
app.get('/test', (req, res) => {
  res.send("Servidor funcionando correctamente");
});

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

  
  
  const privateKeyPath = path.join(__dirname, 'certs/ca/ca-private.key');
  const certPath = path.join(__dirname, 'certs/ca/ca-cert.crt');
  const ext_path = path.join(__dirname, 'ext.cnf')
  var ca_dir = fs.readdirSync(path.join(__dirname,`certs/ca/`))
  if(ca_dir.length > 1) return; 
  console.log('Generando CA raíz...');

  // 1️⃣ Generar la clave privada ECDSA (prime256v1)
  
  execSync(`openssl ecparam -name prime256v1 -genkey -noout -out ${privateKeyPath}`);
  console.log('✔️ Clave privada generada: private_key.pem');
  

  const subject = '/CN=MyOrg-CA/O=MyOrg'; // Ajusta el CN y O según lo necesario
  execSync(
    `openssl req -new -x509 -key ${privateKeyPath} -out ${certPath} -days 3650 -subj "${subject}" -config ${ext_path} -extensions v3_ca`
  );
  
  console.log('✔️ Certificado autofirmado generado: self_signed_cert.pem');
  




}


// Arrancar la aplicación y generar génesis
const PORT = 2000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
  initializeCA();
});
