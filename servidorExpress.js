const express = require('express');
const soap = require('soap');
const fs = require('fs');
const path = require('path');
const http = require('http');

const routerLibrosREST = require('./rest/rutasLibrosREST');
const servicioLibrosSOAP = require('./soap/servicioLibrosSOAP');

const aplicacionExpress = express();
const PUERTO_SERVIDOR = 3000;

aplicacionExpress.use(express.json());

aplicacionExpress.use('/api/libros', routerLibrosREST);

aplicacionExpress.get('/', (req, res) => {
  res.json({
    mensaje: "Sistema de Biblioteca - Comparativa SOAP vs REST",
    rest: "http://localhost:3000/api/libros",
    soap: "http://localhost:3000/soap",
    wsdl: "http://localhost:3000/soap?wsdl"
  });
});

const servidorHTTP = http.createServer(aplicacionExpress);

const rutaContratoWSDL = path.join(__dirname, 'soap', 'contratoLibrosSOAP.wsdl');
const contenidoContratoWSDL = fs.readFileSync(rutaContratoWSDL, 'utf8');

soap.listen(servidorHTTP, '/soap', servicioLibrosSOAP, contenidoContratoWSDL, function () {});

servidorHTTP.listen(PUERTO_SERVIDOR, function () {
  console.log('===========================================');
  console.log('   SISTEMA DE BIBLIOTECA - SOAP vs REST');
  console.log('===========================================');
  console.log('');
  console.log('Servidor iniciado en http://localhost:' + PUERTO_SERVIDOR);
  console.log('');
  console.log('API REST disponible en http://localhost:' + PUERTO_SERVIDOR + '/api/libros');
  console.log('  GET    /api/libros        - Obtener todos los libros');
  console.log('  GET    /api/libros/:cod   - Obtener un libro');
  console.log('  POST   /api/libros        - Registrar un libro');
  console.log('  PUT    /api/libros/:cod   - Actualizar un libro');
  console.log('  DELETE /api/libros/:cod   - Eliminar un libro');
  console.log('');
  console.log('Servicio SOAP disponible en http://localhost:' + PUERTO_SERVIDOR + '/soap');
  console.log('WSDL disponible en http://localhost:' + PUERTO_SERVIDOR + '/soap?wsdl');
  console.log('');
  console.log('Operaciones SOAP:');
  console.log('  ObtenerLibros, BuscarLibro, RegistrarLibro,');
  console.log('  ActualizarLibro, EliminarLibro');
  console.log('===========================================');
});
