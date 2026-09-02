const express = require('express');
const routerLibrosREST = express.Router();
const listaLibrosBiblioteca = require('../datos-biblioteca/librosDatosPrueba');

function obtenerLibrosREST(req, res) {
  res.status(200).json(listaLibrosBiblioteca);
}

function buscarLibroREST(req, res) {
  const libroEncontrado = listaLibrosBiblioteca.find(
    libro => libro.codigo === req.params.codigo
  );
  if (!libroEncontrado) {
    return res.status(404).json({ error: "Libro no encontrado" });
  }
  res.status(200).json(libroEncontrado);
}

function registrarLibroREST(req, res) {
  const { codigo, titulo, autor, anio, disponible } = req.body;

  if (!codigo || !titulo || !autor) {
    return res.status(400).json({
      error: "Los campos codigo, titulo y autor son obligatorios"
    });
  }

  if (anio !== undefined && (typeof anio !== "number" || anio < 0)) {
    return res.status(400).json({ error: "El año debe ser un numero valido" });
  }

  const libroExistente = listaLibrosBiblioteca.find(libro => libro.codigo === codigo);
  if (libroExistente) {
    return res.status(400).json({ error: "Ya existe un libro con ese codigo" });
  }

  const nuevoLibroRegistrado = {
    codigo,
    titulo,
    autor,
    anio: anio || null,
    disponible: disponible !== undefined ? disponible : true
  };

  listaLibrosBiblioteca.push(nuevoLibroRegistrado);
  res.status(201).json(nuevoLibroRegistrado);
}

function actualizarLibroREST(req, res) {
  const indiceLibro = listaLibrosBiblioteca.findIndex(
    libro => libro.codigo === req.params.codigo
  );

  if (indiceLibro === -1) {
    return res.status(404).json({ error: "Libro no encontrado" });
  }

  const { titulo, autor, anio, disponible } = req.body;

  if (!titulo && !autor && anio === undefined && disponible === undefined) {
    return res.status(400).json({
      error: "Debe proporcionar al menos un campo para actualizar"
    });
  }

  if (titulo) listaLibrosBiblioteca[indiceLibro].titulo = titulo;
  if (autor) listaLibrosBiblioteca[indiceLibro].autor = autor;
  if (anio !== undefined) {
    if (typeof anio !== "number" || anio < 0) {
      return res.status(400).json({ error: "El año debe ser un numero valido" });
    }
    listaLibrosBiblioteca[indiceLibro].anio = anio;
  }
  if (disponible !== undefined) {
    listaLibrosBiblioteca[indiceLibro].disponible = disponible;
  }

  res.status(200).json(listaLibrosBiblioteca[indiceLibro]);
}

function eliminarLibroREST(req, res) {
  const indiceLibro = listaLibrosBiblioteca.findIndex(
    libro => libro.codigo === req.params.codigo
  );

  if (indiceLibro === -1) {
    return res.status(404).json({ error: "Libro no encontrado" });
  }

  const libroEliminado = listaLibrosBiblioteca.splice(indiceLibro, 1);
  res.status(200).json({
    mensaje: "Libro eliminado correctamente",
    libro: libroEliminado[0]
  });
}

routerLibrosREST.get("/", obtenerLibrosREST);
routerLibrosREST.get("/:codigo", buscarLibroREST);
routerLibrosREST.post("/", registrarLibroREST);
routerLibrosREST.put("/:codigo", actualizarLibroREST);
routerLibrosREST.delete("/:codigo", eliminarLibroREST);

module.exports = routerLibrosREST;
