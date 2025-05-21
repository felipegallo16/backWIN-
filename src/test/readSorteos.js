const http = require('http');

http.get('http://localhost:3001/sorteos', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Respuesta recibida de /sorteos:', data);
    try {
      const parsed = JSON.parse(data);
      console.log('Parseado:', parsed);
    } catch (e) {
      console.error('No se pudo parsear la respuesta:', e);
    }
  });
}).on('error', (err) => {
  console.error('Error en la petición:', err);
}); 