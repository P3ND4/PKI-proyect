const https = require('http'); // O usa `http` si la API no es segura

const data = JSON.stringify({
  username: "JohnDoe",
  password: "12345",
});

const options = {
  hostname: 'http//localhost', // Cambia por el host de la API
  port: 3000, // Usa 80 para HTTP
  path: '/sign-csr', // Ruta del endpoint
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
  },
};

// Crear la solicitud
const req = https.request(options, (res) => {
  let responseData = '';

  // Recibir datos en fragmentos
  res.on('data', (chunk) => {
    responseData += chunk;
  });

  // Finalizar la respuesta
  res.on('end', () => {
    console.log('Respuesta de la API:', responseData);
  });
});

// Manejo de errores
req.on('error', (error) => {
  console.error('Error en la solicitud:', error);
});

// Escribir los datos en el cuerpo de la solicitud
req.write(data);

// Finalizar la solicitud
req.end();

