const listaLibrosBiblioteca = require('../datos-biblioteca/librosDatosPrueba');

function obtenerLibrosSOAP() {
  return {
    Libros: listaLibrosBiblioteca.map(libro => ({
      Codigo: libro.codigo,
      Titulo: libro.titulo,
      Autor: libro.autor,
      Anio: libro.anio,
      Disponible: libro.disponible
    }))
  };
}

function buscarLibroPorCodigoSOAP(args) {
  const libroEncontrado = listaLibrosBiblioteca.find(
    libro => libro.codigo === args.Codigo
  );

  if (!libroEncontrado) {
    throw {
      Fault: {
        Code: { Value: "soap:Server" },
        Reason: { Text: "Libro no encontrado" },
        Detail: { ErrorCode: "LIBRO_NO_ENCONTRADO" }
      }
    };
  }

  return {
    Codigo: libroEncontrado.codigo,
    Titulo: libroEncontrado.titulo,
    Autor: libroEncontrado.autor,
    Anio: libroEncontrado.anio,
    Disponible: libroEncontrado.disponible
  };
}

function registrarLibroSOAP(args) {
  const { Codigo, Titulo, Autor, Anio, Disponible } = args;

  if (!Codigo || !Titulo || !Autor) {
    throw {
      Fault: {
        Code: { Value: "soap:Client" },
        Reason: { Text: "Los campos Codigo, Titulo y Autor son obligatorios" },
        Detail: { ErrorCode: "CAMPOS_OBLIGATORIOS" }
      }
    };
  }

  if (Anio !== undefined && (typeof Anio !== "number" || Anio < 0)) {
    throw {
      Fault: {
        Code: { Value: "soap:Client" },
        Reason: { Text: "El año debe ser un numero valido" },
        Detail: { ErrorCode: "ANIO_INVALIDO" }
      }
    };
  }

  const libroExistente = listaLibrosBiblioteca.find(libro => libro.codigo === Codigo);
  if (libroExistente) {
    throw {
      Fault: {
        Code: { Value: "soap:Client" },
        Reason: { Text: "Ya existe un libro con ese codigo" },
        Detail: { ErrorCode: "CODIGO_DUPLICADO" }
      }
    };
  }

  const nuevoLibroRegistrado = {
    codigo: Codigo,
    titulo: Titulo,
    autor: Autor,
    anio: Anio || null,
    disponible: Disponible !== undefined ? Disponible : true
  };

  listaLibrosBiblioteca.push(nuevoLibroRegistrado);

  return {
    Codigo: nuevoLibroRegistrado.codigo,
    Titulo: nuevoLibroRegistrado.titulo,
    Autor: nuevoLibroRegistrado.autor,
    Anio: nuevoLibroRegistrado.anio,
    Disponible: nuevoLibroRegistrado.disponible,
    Mensaje: "Libro registrado correctamente"
  };
}

function actualizarLibroSOAP(args) {
  const { Codigo, Titulo, Autor, Anio, Disponible } = args;
  const indiceLibro = listaLibrosBiblioteca.findIndex(
    libro => libro.codigo === Codigo
  );

  if (indiceLibro === -1) {
    throw {
      Fault: {
        Code: { Value: "soap:Server" },
        Reason: { Text: "Libro no encontrado" },
        Detail: { ErrorCode: "LIBRO_NO_ENCONTRADO" }
      }
    };
  }

  if (!Titulo && !Autor && Anio === undefined && Disponible === undefined) {
    throw {
      Fault: {
        Code: { Value: "soap:Client" },
        Reason: { Text: "Debe proporcionar al menos un campo para actualizar" },
        Detail: { ErrorCode: "SIN_CAMPOS" }
      }
    };
  }

  if (Titulo) listaLibrosBiblioteca[indiceLibro].titulo = Titulo;
  if (Autor) listaLibrosBiblioteca[indiceLibro].autor = Autor;
  if (Anio !== undefined) {
    if (typeof Anio !== "number" || Anio < 0) {
      throw {
        Fault: {
          Code: { Value: "soap:Client" },
          Reason: { Text: "El año debe ser un numero valido" },
          Detail: { ErrorCode: "ANIO_INVALIDO" }
        }
      };
    }
    listaLibrosBiblioteca[indiceLibro].anio = Anio;
  }
  if (Disponible !== undefined) {
    listaLibrosBiblioteca[indiceLibro].disponible = Disponible;
  }

  return {
    Codigo: listaLibrosBiblioteca[indiceLibro].codigo,
    Titulo: listaLibrosBiblioteca[indiceLibro].titulo,
    Autor: listaLibrosBiblioteca[indiceLibro].autor,
    Anio: listaLibrosBiblioteca[indiceLibro].anio,
    Disponible: listaLibrosBiblioteca[indiceLibro].disponible,
    Mensaje: "Libro actualizado correctamente"
  };
}

function eliminarLibroSOAP(args) {
  const indiceLibro = listaLibrosBiblioteca.findIndex(
    libro => libro.codigo === args.Codigo
  );

  if (indiceLibro === -1) {
    throw {
      Fault: {
        Code: { Value: "soap:Server" },
        Reason: { Text: "Libro no encontrado" },
        Detail: { ErrorCode: "LIBRO_NO_ENCONTRADO" }
      }
    };
  }

  const libroEliminado = listaLibrosBiblioteca.splice(indiceLibro, 1);
  return {
    Codigo: libroEliminado[0].codigo,
    Titulo: libroEliminado[0].titulo,
    Autor: libroEliminado[0].autor,
    Anio: libroEliminado[0].anio,
    Disponible: libroEliminado[0].disponible,
    Mensaje: "Libro eliminado correctamente"
  };
}

const servicioLibrosSOAP = {
  LibroService: {
    LibroPort: {
      ObtenerLibros: obtenerLibrosSOAP,
      BuscarLibro: buscarLibroPorCodigoSOAP,
      RegistrarLibro: registrarLibroSOAP,
      ActualizarLibro: actualizarLibroSOAP,
      EliminarLibro: eliminarLibroSOAP
    }
  }
};

module.exports = servicioLibrosSOAP;
