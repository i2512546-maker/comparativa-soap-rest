const express = require('express');
const soap = require('soap');
const fs = require('fs');
const path = require('path');

const servicioLibrosSOAP = require('./soap/servicioLibrosSOAP');
const listaLibros = require('./datos-biblioteca/librosDatosPrueba');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', true);
app.use(express.json());

// CORS para probar desde el navegador
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// --- API REST (secundaria, para comparar) ---
app.get('/api/libros', (req, res) => res.json(listaLibros));

app.get('/api/libros/:cod', (req, res) => {
  const libro = listaLibros.find(l => l.codigo === req.params.cod);
  if (!libro) return res.status(404).json({ error: 'Libro no encontrado' });
  res.json(libro);
});

app.post('/api/libros', (req, res) => {
  const { codigo, titulo, autor, anio, disponible } = req.body;
  if (!codigo || !titulo || !autor) {
    return res.status(400).json({ error: 'Campos obligatorios: codigo, titulo, autor' });
  }
  if (listaLibros.find(l => l.codigo === codigo)) {
    return res.status(400).json({ error: 'Codigo duplicado' });
  }
  const libro = { codigo, titulo, autor, anio: anio || null, disponible: disponible !== undefined ? disponible : true };
  listaLibros.push(libro);
  res.status(201).json(libro);
});

app.put('/api/libros/:cod', (req, res) => {
  const idx = listaLibros.findIndex(l => l.codigo === req.params.cod);
  if (idx === -1) return res.status(404).json({ error: 'Libro no encontrado' });
  const { titulo, autor, anio, disponible } = req.body;
  if (titulo) listaLibros[idx].titulo = titulo;
  if (autor) listaLibros[idx].autor = autor;
  if (anio !== undefined) listaLibros[idx].anio = anio;
  if (disponible !== undefined) listaLibros[idx].disponible = disponible;
  res.json(listaLibros[idx]);
});

app.delete('/api/libros/:cod', (req, res) => {
  const idx = listaLibros.findIndex(l => l.codigo === req.params.cod);
  if (idx === -1) return res.status(404).json({ error: 'Libro no encontrado' });
  const eliminado = listaLibros.splice(idx, 1);
  res.json({ mensaje: 'Eliminado', libro: eliminado[0] });
});

// --- Informacion del servicio ---
app.get('/', (req, res) => {
  res.json({
    servicio: 'Biblioteca SOAP vs REST (enfocado en SOAP)',
    operaciones: ['ObtenerLibros', 'BuscarLibro', 'RegistrarLibro', 'ActualizarLibro', 'EliminarLibro'],
    soap: '/soap',
    wsdl: '/soap?wsdl',
    rest: '/api/libros'
  });
});

// --- SOAP ---
// La URL publica del servidor se obtiene de la peticion (funciona en cualquier nube)
function obtenerBaseUrl(req) {
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host || `localhost:${PORT}`;
  return `${proto}://${host}`;
}

const rutaWSDL = path.join(__dirname, 'soap', 'contratoLibrosSOAP.wsdl');
const wsdlPlantilla = fs.readFileSync(rutaWSDL, 'utf8');

// GET /soap y /soap?wsdl -> WSDL con la URL correcta segun la peticion
app.get('/soap', (req, res) => {
  const baseUrl = obtenerBaseUrl(req);
  const wsdlConDireccionCorrecta = wsdlPlantilla.replace(/http:\/\/localhost:\d+\/soap/g, `${baseUrl}/soap`);
  res.type('application/xml');
  res.send(wsdlConDireccionCorrecta);
});

// POST /soap -> procesa las llamadas SOAP (registra la ruta cuando el WSDL este listo)
soap.listen(app, '/soap', servicioLibrosSOAP, wsdlPlantilla);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
  console.log(`SOAP endpoint:   /soap`);
  console.log(`WSDL:            /soap?wsdl`);
  console.log(`REST endpoint:   /api/libros`);
});