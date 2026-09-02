const http = require('http');
const listaLibrosPrueba = require('../datos-biblioteca/librosDatosPrueba');

const URL_BASE_SERVIDOR = 'http://localhost:3000';

let totalPruebasPasadas = 0;
let totalPruebasFallidas = 0;
let totalPruebasEjecutadas = 0;

function hacerPeticionHTTP(method, ruta, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(ruta, URL_BASE_SERVIDOR);
    const opcionesPeticion = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      headers: { "Content-Type": "application/json" }
    };

    const peticionHTTP = http.request(opcionesPeticion, (respuestaHTTP) => {
      let datosRespuesta = "";
      respuestaHTTP.on("data", chunk => datosRespuesta += chunk);
      respuestaHTTP.on("end", () => {
        try {
          resolve({ status: respuestaHTTP.statusCode, body: JSON.parse(datosRespuesta) });
        } catch (e) {
          resolve({ status: respuestaHTTP.statusCode, body: datosRespuesta });
        }
      });
    });

    peticionHTTP.on("error", reject);
    if (body) peticionHTTP.write(JSON.stringify(body));
    peticionHTTP.end();
  });
}

function verificarPrueba(nombrePrueba, condicionVerificar) {
  totalPruebasEjecutadas++;
  if (condicionVerificar) {
    totalPruebasPasadas++;
    console.log(`  PASS: ${nombrePrueba}`);
  } else {
    totalPruebasFallidas++;
    console.log(`  FAIL: ${nombrePrueba}`);
  }
}

async function pruebaObtenerTodosLosLibros() {
  console.log("\n1. Obtener todos los libros");
  const respuestaHTTP = await hacerPeticionHTTP("GET", "/api/libros");
  verificarPrueba("Status 200", respuestaHTTP.status === 200);
  verificarPrueba("Es un array", Array.isArray(respuestaHTTP.body));
  verificarPrueba("Tiene al menos 3 libros", respuestaHTTP.body.length >= 3);
}

async function pruebaBuscarLibroExistente() {
  console.log("\n2. Buscar libro existente (LIB001)");
  const respuestaHTTP = await hacerPeticionHTTP("GET", "/api/libros/LIB001");
  verificarPrueba("Status 200", respuestaHTTP.status === 200);
  verificarPrueba("Codigo correcto", respuestaHTTP.body.codigo === "LIB001");
  verificarPrueba("Titulo correcto", respuestaHTTP.body.titulo === listaLibrosPrueba[0].titulo);
  verificarPrueba("Autor correcto", respuestaHTTP.body.autor === listaLibrosPrueba[0].autor);
  verificarPrueba("Anio correcto", respuestaHTTP.body.anio === 1967);
  verificarPrueba("Disponible es true", respuestaHTTP.body.disponible === true);
}

async function pruebaBuscarLibroInexistente() {
  console.log("\n3. Buscar libro inexistente (LIB999)");
  const respuestaHTTP = await hacerPeticionHTTP("GET", "/api/libros/LIB999");
  verificarPrueba("Status 404", respuestaHTTP.status === 404);
  verificarPrueba("Mensaje de error", respuestaHTTP.body.error === "Libro no encontrado");
}

async function pruebaRegistrarLibro() {
  console.log("\n4. Registrar nuevo libro");
  const datosNuevoLibro = {
    codigo: "LIB004",
    titulo: "La casa de los espiritus",
    autor: "Isabel Allende",
    anio: 1982,
    disponible: true
  };
  const respuestaHTTP = await hacerPeticionHTTP("POST", "/api/libros", datosNuevoLibro);
  verificarPrueba("Status 201", respuestaHTTP.status === 201);
  verificarPrueba("Codigo correcto", respuestaHTTP.body.codigo === "LIB004");
  verificarPrueba("Titulo correcto", respuestaHTTP.body.titulo === "La casa de los espiritus");
}

async function pruebaRegistrarCodigoDuplicado() {
  console.log("\n5. Registrar codigo duplicado");
  const datosDuplicados = {
    codigo: "LIB001",
    titulo: "Libro duplicado",
    autor: "Autor",
    anio: 2000
  };
  const respuestaHTTP = await hacerPeticionHTTP("POST", "/api/libros", datosDuplicados);
  verificarPrueba("Status 400", respuestaHTTP.status === 400);
  verificarPrueba("Mensaje de error", respuestaHTTP.body.error === "Ya existe un libro con ese codigo");
}

async function pruebaRegistrarCamposObligatorios() {
  console.log("\n6. Registrar sin campos obligatorios");
  const datosIncompletos = { titulo: "Sin codigo" };
  const respuestaHTTP = await hacerPeticionHTTP("POST", "/api/libros", datosIncompletos);
  verificarPrueba("Status 400", respuestaHTTP.status === 400);
  verificarPrueba("Mensaje de error", respuestaHTTP.body.error.includes("obligatorios"));
}

async function pruebaActualizarLibro() {
  console.log("\n7. Actualizar libro (LIB004)");
  const datosActualizacion = { titulo: "La casa de los espiritus - Edicion revisada" };
  const respuestaHTTP = await hacerPeticionHTTP("PUT", "/api/libros/LIB004", datosActualizacion);
  verificarPrueba("Status 200", respuestaHTTP.status === 200);
  verificarPrueba("Titulo actualizado", respuestaHTTP.body.titulo === "La casa de los espiritus - Edicion revisada");
}

async function pruebaActualizarLibroInexistente() {
  console.log("\n8. Actualizar libro inexistente");
  const respuestaHTTP = await hacerPeticionHTTP("PUT", "/api/libros/LIB999", { titulo: "X" });
  verificarPrueba("Status 404", respuestaHTTP.status === 404);
}

async function pruebaEliminarLibro() {
  console.log("\n9. Eliminar libro (LIB004)");
  const respuestaHTTP = await hacerPeticionHTTP("DELETE", "/api/libros/LIB004");
  verificarPrueba("Status 200", respuestaHTTP.status === 200);
  verificarPrueba("Mensaje de confirmacion", respuestaHTTP.body.mensaje === "Libro eliminado correctamente");

  const respuestaVerificacion = await hacerPeticionHTTP("GET", "/api/libros/LIB004");
  verificarPrueba("Libro ya no existe", respuestaVerificacion.status === 404);
}

async function pruebaEliminarLibroInexistente() {
  console.log("\n10. Eliminar libro inexistente");
  const respuestaHTTP = await hacerPeticionHTTP("DELETE", "/api/libros/LIB999");
  verificarPrueba("Status 404", respuestaHTTP.status === 404);
}

async function ejecutarTodasLasPruebas() {
  console.log("===========================================");
  console.log("  PRUEBAS REST - API de Libros");
  console.log("===========================================");

  await pruebaObtenerTodosLosLibros();
  await pruebaBuscarLibroExistente();
  await pruebaBuscarLibroInexistente();
  await pruebaRegistrarLibro();
  await pruebaRegistrarCodigoDuplicado();
  await pruebaRegistrarCamposObligatorios();
  await pruebaActualizarLibro();
  await pruebaActualizarLibroInexistente();
  await pruebaEliminarLibro();
  await pruebaEliminarLibroInexistente();

  console.log("\n===========================================");
  console.log(`  RESULTADOS: ${totalPruebasPasadas}/${totalPruebasEjecutadas} pasaron, ${totalPruebasFallidas} fallaron`);
  console.log("===========================================");

  process.exit(totalPruebasFallidas > 0 ? 1 : 0);
}

ejecutarTodasLasPruebas().catch(error => {
  console.error("Error ejecutando pruebas:", error);
  process.exit(1);
});
