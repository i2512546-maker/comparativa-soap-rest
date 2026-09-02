# Comparativa SOAP vs REST - Sistema de Biblioteca

## Introduccion

Este proyecto academico implementa un sistema de gestion de libros de una biblioteca utilizando dos enfoques diferentes para la comunicacion entre sistemas: **SOAP** (Simple Object Access Protocol) y **REST** (Representational State Transfer). El objetivo es demostrar y comparar ambas tecnologias implementando las mismas operaciones con cada una.

## Tecnologias

- **Node.js** - Entorno de ejecucion de JavaScript
- **ExpressJS** - Framework web para Node.js
- **soap** - Libreria para implementar servicios SOAP en Node.js
- **XML** - Formato de datos para SOAP
- **JSON** - Formato de datos para REST
- **WSDL** - Web Services Description Language, describe el servicio SOAP
- **HTTP** - Protocolo de comunicacion

## Instalacion

```bash
npm install
```

## Ejecucion

```bash
npm start
```

El servidor iniciara en el puerto 3000 y mostrara:

```
===========================================
   SISTEMA DE BIBLIOTECA - SOAP vs REST
===========================================

Servidor iniciado en http://localhost:3000

API REST disponible en http://localhost:3000/api/libros
Servicio SOAP disponible en http://localhost:3000/soap
WSDL disponible en http://localhost:3000/soap?wsdl
===========================================
```

## Pruebas

```bash
npm test
```

## API REST

La API REST utiliza JSON y los verbos HTTP estandar.

### Endpoints

| Metodo   | Ruta              | Descripcion           |
| -------- | ----------------- | --------------------- |
| GET      | /api/libros       | Obtener todos libros  |
| GET      | /api/libros/:cod  | Obtener un libro      |
| POST     | /api/libros       | Registrar un libro    |
| PUT      | /api/libros/:cod  | Actualizar un libro   |
| DELETE   | /api/libros/:cod  | Eliminar un libro     |

### Ejemplos

**Obtener todos los libros:**
```http
GET /api/libros
```

Respuesta:
```json
[
  {
    "codigo": "LIB001",
    "titulo": "Cien anios de soledad",
    "autor": "Gabriel Garcia Marquez",
    "anio": 1967,
    "disponible": true
  }
]
```

**Buscar un libro:**
```http
GET /api/libros/LIB001
```

Respuesta:
```json
{
  "codigo": "LIB001",
  "titulo": "Cien anios de soledad",
  "autor": "Gabriel Garcia Marquez",
  "anio": 1967,
  "disponible": true
}
```

**Registrar un libro:**
```http
POST /api/libros
Content-Type: application/json

{
  "codigo": "LIB004",
  "titulo": "El principito",
  "autor": "Antoine de Saint-Exupery",
  "anio": 1943,
  "disponible": true
}
```

**Actualizar un libro:**
```http
PUT /api/libros/LIB001
Content-Type: application/json

{
  "titulo": "Cien anios de soledad - Edicion especial"
}
```

**Eliminar un libro:**
```http
DELETE /api/libros/LIB001
```

### Codigos de respuesta

| Codigo | Significado                     |
| ------ | ------------------------------- |
| 200    | Operacion exitosa               |
| 201    | Libro creado exitosamente       |
| 400    | Solicitud incorrecta            |
| 404    | Libro no encontrado             |
| 500    | Error interno del servidor      |

## Servicio SOAP

El servicio SOAP utiliza XML y esta documentado mediante WSDL.

- **Endpoint:** http://localhost:3000/soap
- **WSDL:** http://localhost:3000/soap?wsdl

### Operaciones

| Operacion       | Descripcion           |
| --------------- | --------------------- |
| ObtenerLibros   | Lista todos los libros |
| BuscarLibro     | Busca un libro por codigo |
| RegistrarLibro  | Registra un nuevo libro |
| ActualizarLibro | Actualiza un libro existente |
| EliminarLibro   | Elimina un libro      |

### Ejemplo: BuscarLibro

Request XML:
```xml
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:tns="http://biblioteca.com/servicios/libros">
  <soap:Body>
    <tns:BuscarLibro>
      <tns:Codigo>LIB001</tns:Codigo>
    </tns:BuscarLibro>
  </soap:Body>
</soap:Envelope>
```

Response XML:
```xml
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:tns="http://biblioteca.com/servicios/libros">
  <soap:Body>
    <tns:BuscarLibroResponse>
      <tns:Codigo>LIB001</tns:Codigo>
      <tns:Titulo>Cien anios de soledad</tns:Titulo>
      <tns:Autor>Gabriel Garcia Marquez</tns:Autor>
      <tns:Anio>1967</tns:Anio>
      <tns:Disponible>true</tns:Disponible>
    </tns:BuscarLibroResponse>
  </soap:Body>
</soap:Envelope>
```

## Comparacion

### Forma de comunicacion

REST se comunica directamente utilizando los verbos HTTP (GET, POST, PUT, DELETE) y recursos identificados por URLs. SOAP, en cambio, envia siempre a traves de HTTP POST un mensaje XML con una estructura especifica que incluye Envelope, Header y Body.

### Formato de datos

REST trabaja predominantemente con JSON, lo que lo hace mas ligero y facil de leer. SOAP utiliza XML exclusivamente, lo que proporciona mayor formalidad pero mayor verbosidad.

### Documentacion

SOAP requiere un archivo WSDL que describe formalmente el servicio: operaciones, parametros, tipos de datos y endpoint. REST no tiene un estandar equivalente obligatorio, aunque existen herramientas como Swagger/OpenAPI.

### Complejidad

REST es mas sencillo de implementar y consumir. SOAP requiere manejar la estructura XML, los envelopes, los Faults y la definicion WSDL, lo que aumenta la complejidad tanto en implementacion como en depuracion.

### Manejo de errores

REST utiliza los codigos de estado HTTP (404, 400, 500, etc.) junto con un cuerpo JSON descriptivo. SOAP utiliza el mecanismo de Fault dentro del XML, que incluye codigo, razon y detalles del error.

### Flexibilidad

REST es mas flexible: permite diferentes formatos de respuesta, es mas facil de consumir desde cualquier cliente, y es el estandar predominante en APIs web modernas. SOAP es mas rigido pero ofrece mayor fiabilidad en entornos empresariales.

| Caracteristica | SOAP                              | REST                   |
| -------------- | --------------------------------- | ---------------------- |
| Tipo           | Protocolo                         | Estilo arquitectonico  |
| Formato        | XML                               | JSON                   |
| WSDL           | Si                                | No                     |
| Metodos HTTP   | No es su caracteristica principal | GET, POST, PUT, DELETE |
| Complejidad    | Mayor                             | Menor                  |
| Flexibilidad   | Menor                             | Mayor                  |
| Estructura     | Muy formal                        | Mas flexible           |
| Uso            | Sistemas empresariales            | APIs web               |

## Estructura del proyecto

```
comparativa-soap-rest/
|
+-- package.json
+-- servidorExpress.js
+-- README.md
+-- COMPARACION_SOAP_REST.md
+-- DOCUMENTACION.md
|
+-- datos-biblioteca/
|   +-- librosDatosPrueba.js
|
+-- rest/
|   +-- rutasLibrosREST.js
|
+-- soap/
|   +-- servicioLibrosSOAP.js
|   +-- contratoLibrosSOAP.wsdl
|
+-- tests/
    +-- pruebasREST.js
```

## Licencia

Proyecto academico.
