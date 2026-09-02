# Documentacion Tecnica - Comparativa SOAP vs REST

## 1. Introduccion

El presente proyecto tiene como finalidad implementar un sistema de gestion de libros de una biblioteca utilizando dos paradigmas diferentes de comunicacion: SOAP (Simple Object Access Protocol) y REST (Representational State Transfer). El sistema permite realizar operaciones CRUD (Crear, Leer, Actualizar, Eliminar) sobre una coleccion de libros, implementando las mismas funcionalidades mediante ambos enfoques para facilitar su comparacion directa.

## 2. Objetivo general

Desarrollar un sistema de biblioteca que permita comparar objetivamente las diferencias, ventajas y desventajas de SOAP y REST como tecnologias para la implementacion de servicios web, mediante una implementacion practica y funcional de ambas.

## 3. Objetivos especificos

- Implementar una API REST completa con operaciones CRUD para la gestion de libros.
- Implementar un servicio SOAP equivalente con las mismas operaciones.
- Crear un archivo WSDL que documente formalmente el servicio SOAP.
- Utilizar los mismos datos para ambas implementaciones.
- Documentar las diferencias tecnicas entre ambos enfoques.
- Analizar la complejidad de implementacion de cada tecnologia.
- Comparar el formato de mensajes, manejo de errores y rendimiento.

## 4. Descripcion del problema

En el desarrollo de software empresarial, es frecuente la necesidad de comunicar sistemas entre si. Existen diferentes tecnologias para lograrlo, siendo SOAP y REST las mas utilizadas. SOAP es un protocolo maduro y establecido en entornos empresariales, mientras que REST se ha convertido en el estandar de facto para APIs web modernas.

La implementacion conjunta de ambas tecnologias permite una comprension profunda de sus diferencias, lo cual es fundamental para tomar decisiones informadas en el diseno de arquitecturas de software.

## 5. Arquitectura

El sistema esta compuesto por un servidor ExpressJS que expone dos interfaces de comunicacion:

```
                 SISTEMA DE BIBLIOTECA
                         |
              +----------+----------+
              |                     |
             REST                  SOAP
              |                     |
          ExpressJS              ExpressJS
              |                     |
             JSON                   XML
              |                     |
              +----------+----------+
                         |
                    MISMA LOGICA
                         |
                       LIBROS
```

- **REST API:** Expuesta en `/api/libros` utilizando verbos HTTP y formato JSON.
- **SOAP Service:** Expuesto en `/soap` utilizando mensajes XML y documentado mediante WSDL.
- **Datos compartidos:** Ambas implementaciones operan sobre la misma coleccion de libros almacenada en `datos-biblioteca/librosDatosPrueba.js`.

## 6. Estructura del proyecto

```
comparativa-soap-rest/
|
+-- package.json              # Configuracion del proyecto y dependencias
+-- servidorExpress.js        # Punto de entrada del servidor
+-- README.md                 # Documentacion general
+-- COMPARACION_SOAP_REST.md  # Analisis comparativo SOAP vs REST
+-- DOCUMENTACION.md          # Este archivo
|
+-- datos-biblioteca/
|   +-- librosDatosPrueba.js  # Datos compartidos (coleccion de libros)
|
+-- rest/
|   +-- rutasLibrosREST.js    # Rutas de la API REST
|
+-- soap/
|   +-- servicioLibrosSOAP.js # Implementacion del servicio SOAP
|   +-- contratoLibrosSOAP.wsdl # Definicion WSDL del servicio
|
+-- tests/
    +-- pruebasREST.js        # Pruebas automatizadas de la API REST
```

## 7. Implementacion REST

La API REST fue implementada utilizando ExpressJS con las siguientes caracteristicas:

### Funciones implementadas

| Funcion                    | Metodo HTTP | Ruta              | Descripcion                    |
| -------------------------- | ----------- | ----------------- | ------------------------------ |
| obtenerLibrosREST          | GET         | /api/libros       | Obtener todos los libros       |
| buscarLibroREST            | GET         | /api/libros/:cod  | Obtener un libro por codigo    |
| registrarLibroREST         | POST        | /api/libros       | Registrar un nuevo libro       |
| actualizarLibroREST        | PUT         | /api/libros/:cod  | Actualizar un libro            |
| eliminarLibroREST          | DELETE      | /api/libros/:cod  | Eliminar un libro              |

### Codigos de respuesta HTTP

- **200 OK:** Operacion exitosa (consultas, actualizaciones, eliminaciones).
- **201 Created:** Libro creado exitosamente.
- **400 Bad Request:** Solicitud incorrecta (campos faltantes, codigo duplicado).
- **404 Not Found:** Libro no encontrado.
- **500 Internal Server Error:** Error interno del servidor.

### Formato de datos

Las respuestas REST utilizan JSON. Ejemplo:

```json
{
  "codigo": "LIB001",
  "titulo": "Cien anios de soledad",
  "autor": "Gabriel Garcia Marquez",
  "anio": 1967,
  "disponible": true
}
```

## 8. Implementacion SOAP

El servicio SOAP fue implementado utilizando la libreria `soap` para Node.js.

### Funciones implementadas

| Funcion                     | Operacion SOAP  | Descripcion                  |
| --------------------------- | --------------- | ---------------------------- |
| obtenerLibrosSOAP           | ObtenerLibros   | Lista todos los libros       |
| buscarLibroPorCodigoSOAP    | BuscarLibro     | Busca un libro por codigo    |
| registrarLibroSOAP          | RegistrarLibro  | Registra un nuevo libro      |
| actualizarLibroSOAP         | ActualizarLibro | Actualiza un libro existente |
| eliminarLibroSOAP           | EliminarLibro   | Elimina un libro             |

### Endpoint

- **Servicio SOAP:** http://localhost:3000/soap
- **WSDL:** http://localhost:3000/soap?wsdl

## 9. WSDL

El archivo WSDL (`soap/contratoLibrosSOAP.wsdl`) define formalmente el servicio SOAP con:

### Estructura del WSDL

1. **Types:** Define los tipos de datos (Libro) y los elementos de entrada/salida.
2. **Messages:** Define los mensajes de entrada y salida para cada operacion.
3. **PortType:** Define las operaciones disponibles (ObtenerLibros, BuscarLibro, etc.).
4. **Binding:** Especifica el protocolo de transporte (SOAP/HTTP) y el estilo (document/literal).
5. **Service:** Define el nombre del servicio y la ubicacion del endpoint.

### Namespace

```xml
targetNamespace="http://biblioteca.com/servicios/libros"
```

## 10. Request REST

### Obtener todos los libros

```http
GET /api/libros HTTP/1.1
Host: localhost:3000
```

### Buscar un libro

```http
GET /api/libros/LIB001 HTTP/1.1
Host: localhost:3000
```

### Registrar un libro

```http
POST /api/libros HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "codigo": "LIB004",
  "titulo": "Rayuela",
  "autor": "Julio Cortazar",
  "anio": 1963,
  "disponible": true
}
```

### Actualizar un libro

```http
PUT /api/libros/LIB001 HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "titulo": "Cien anios de soledad - Edicion especial"
}
```

### Eliminar un libro

```http
DELETE /api/libros/LIB001 HTTP/1.1
Host: localhost:3000
```

## 11. Response REST

### Obtener todos los libros (200 OK)

```json
[
  {
    "codigo": "LIB001",
    "titulo": "Cien anios de soledad",
    "autor": "Gabriel Garcia Marquez",
    "anio": 1967,
    "disponible": true
  },
  {
    "codigo": "LIB002",
    "titulo": "Don Quijote de la Mancha",
    "autor": "Miguel de Cervantes",
    "anio": 1605,
    "disponible": true
  }
]
```

### Buscar un libro (200 OK)

```json
{
  "codigo": "LIB001",
  "titulo": "Cien anios de soledad",
  "autor": "Gabriel Garcia Marquez",
  "anio": 1967,
  "disponible": true
}
```

### Libro no encontrado (404 Not Found)

```json
{
  "error": "Libro no encontrado"
}
```

### Codigo duplicado (400 Bad Request)

```json
{
  "error": "Ya existe un libro con ese codigo"
}
```

### Libro eliminado (200 OK)

```json
{
  "mensaje": "Libro eliminado correctamente",
  "libro": {
    "codigo": "LIB001",
    "titulo": "Cien anios de soledad",
    "autor": "Gabriel Garcia Marquez",
    "anio": 1967,
    "disponible": true
  }
}
```

## 12. Request SOAP

### BuscarLibro

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

### ObtenerLibros

```xml
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:tns="http://biblioteca.com/servicios/libros">
  <soap:Body>
    <tns:ObtenerLibros/>
  </soap:Body>
</soap:Envelope>
```

### RegistrarLibro

```xml
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:tns="http://biblioteca.com/servicios/libros">
  <soap:Body>
    <tns:RegistrarLibro>
      <tns:Codigo>LIB004</tns:Codigo>
      <tns:Titulo>Rayuela</tns:Titulo>
      <tns:Autor>Julio Cortazar</tns:Autor>
      <tns:Anio>1963</tns:Anio>
      <tns:Disponible>true</tns:Disponible>
    </tns:RegistrarLibro>
  </soap:Body>
</soap:Envelope>
```

### ActualizarLibro

```xml
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:tns="http://biblioteca.com/servicios/libros">
  <soap:Body>
    <tns:ActualizarLibro>
      <tns:Codigo>LIB001</tns:Codigo>
      <tns:Titulo>Cien anios de soledad - Edicion especial</tns:Titulo>
    </tns:ActualizarLibro>
  </soap:Body>
</soap:Envelope>
```

### EliminarLibro

```xml
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:tns="http://biblioteca.com/servicios/libros">
  <soap:Body>
    <tns:EliminarLibro>
      <tns:Codigo>LIB001</tns:Codigo>
    </tns:EliminarLibro>
  </soap:Body>
</soap:Envelope>
```

## 13. Response SOAP

### BuscarLibroResponse

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

### ObtenerLibrosResponse

```xml
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:tns="http://biblioteca.com/servicios/libros">
  <soap:Body>
    <tns:ObtenerLibrosResponse>
      <tns:Libros>
        <tns:Codigo>LIB001</tns:Codigo>
        <tns:Titulo>Cien anios de soledad</tns:Titulo>
        <tns:Autor>Gabriel Garcia Marquez</tns:Autor>
        <tns:Anio>1967</tns:Anio>
        <tns:Disponible>true</tns:Disponible>
      </tns:Libros>
      <tns:Libros>
        <tns:Codigo>LIB002</tns:Codigo>
        <tns:Titulo>Don Quijote de la Mancha</tns:Titulo>
        <tns:Autor>Miguel de Cervantes</tns:Autor>
        <tns:Anio>1605</tns:Anio>
        <tns:Disponible>true</tns:Disponible>
      </tns:Libros>
    </tns:ObtenerLibrosResponse>
  </soap:Body>
</soap:Envelope>
```

### RegistrarLibroResponse

```xml
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:tns="http://biblioteca.com/servicios/libros">
  <soap:Body>
    <tns:RegistrarLibroResponse>
      <tns:Codigo>LIB004</tns:Codigo>
      <tns:Titulo>Rayuela</tns:Titulo>
      <tns:Autor>Julio Cortazar</tns:Autor>
      <tns:Anio>1963</tns:Anio>
      <tns:Disponible>true</tns:Disponible>
      <tns:Mensaje>Libro registrado correctamente</tns:Mensaje>
    </tns:RegistrarLibroResponse>
  </soap:Body>
</soap:Envelope>
```

### EliminarLibroResponse

```xml
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:tns="http://biblioteca.com/servicios/libros">
  <soap:Body>
    <tns:EliminarLibroResponse>
      <tns:Codigo>LIB001</tns:Codigo>
      <tns:Titulo>Cien anios de soledad</tns:Titulo>
      <tns:Autor>Gabriel Garcia Marquez</tns:Autor>
      <tns:Anio>1967</tns:Anio>
      <tns:Disponible>true</tns:Disponible>
      <tns:Mensaje>Libro eliminado correctamente</tns:Mensaje>
    </tns:EliminarLibroResponse>
  </soap:Body>
</soap:Envelope>
```

### SOAP Fault (Error)

```xml
<soap:Fault>
  <faultcode>soap:Server</faultcode>
  <faultstring>Libro no encontrado</faultstring>
  <detail>
    <ErrorCode>LIBRO_NO_ENCONTRADO</ErrorCode>
  </detail>
</soap:Fault>
```

## 14. Manejo de errores

### REST - Manejo de errores

| Error                          | Codigo HTTP | Respuesta JSON                                  |
| ------------------------------ | ----------- | ----------------------------------------------- |
| Libro no encontrado            | 404         | `{ "error": "Libro no encontrado" }`            |
| Campos obligatorios faltantes  | 400         | `{ "error": "Los campos codigo... son obligatorios" }` |
| Codigo duplicado               | 400         | `{ "error": "Ya existe un libro con ese codigo" }` |
| Anio invalido                  | 400         | `{ "error": "El ano debe ser un numero valido" }` |
| Sin campos para actualizar     | 400         | `{ "error": "Debe proporcionar al menos un campo..." }` |

### SOAP - Manejo de errores

SOAP utiliza el mecanismo de Fault con las siguientes categorias:

| Error                          | Fault Code     | Reason                                     |
| ------------------------------ | -------------- | ------------------------------------------ |
| Libro no encontrado            | soap:Server    | Libro no encontrado                        |
| Campos obligatorios faltantes  | soap:Client    | Los campos Codigo, Titulo y Autor son obligatorios |
| Codigo duplicado               | soap:Client    | Ya existe un libro con ese codigo          |
| Anio invalido                  | soap:Client    | El ano debe ser un numero valido           |
| Sin campos para actualizar     | soap:Client    | Debe proporcionar al menos un campo para actualizar |

## 15. Pruebas

### Pruebas REST automatizadas

El archivo `tests/pruebasREST.js` contiene 10 pruebas automatizadas:

1. Obtener todos los libros (verifica status 200, array, minimo 3 libros)
2. Buscar libro existente LIB001 (verifica campos)
3. Buscar libro inexistente LIB999 (verifica 404)
4. Registrar nuevo libro LIB004 (verifica 201)
5. Registrar codigo duplicado LIB001 (verifica 400)
6. Registrar sin campos obligatorios (verifica 400)
7. Actualizar libro LIB004 (verifica 200)
8. Actualizar libro inexistente (verifica 404)
9. Eliminar libro LIB004 (verifica 200 y desaparicion)
10. Eliminar libro inexistente (verifica 404)

Ejecucion:
```bash
npm test
```

### Pruebas SOAP manuales

Para probar el servicio SOAP se puede utilizar Postman o SoapUI:

1. Abrir SoapUI
2. Crear un nuevo proyecto SOAP
3. Importar el WSDL desde http://localhost:3000/soap?wsdl
4. Realizar las operaciones deseadas

Ejemplo con Postman:
- Method: POST
- URL: http://localhost:3000/soap
- Body: XML con la operacion deseada
- Header: Content-Type: text/xml

## 16. Comparacion SOAP vs REST

### Comparacion de codigo

| Aspecto                     | REST                          | SOAP                          |
| --------------------------- | ----------------------------- | ----------------------------- |
| Lineas de codigo (rutas)    | ~50 lineas                    | ~80 lineas (servicio)         |
| Archivos necesarios         | 1 archivo (rutasLibrosREST.js)| 2 archivos (servicio + WSDL)  |
| Formato de respuesta        | JSON directo                  | XML con Envelope              |
| Definicion del servicio     | Implicita (codigo)            | Explicita (WSDL)              |
| Validacion de tipos         | Manual                        | Automatica (WSDL/XSD)         |

### Comparacion de mensajes

| Aspecto                     | REST (JSON)                   | SOAP (XML)                    |
| --------------------------- | ----------------------------- | ----------------------------- |
| Tamano promedio             | ~150 bytes                    | ~500 bytes                    |
| Legibilidad humana          | Alta                          | Media                         |
| Parseo                      | JSON.parse()                  | Libreria XML                  |
| Namespaces                  | No aplica                     | Requeridos                    |

### Comparacion de depuracion

| Aspecto                     | REST                          | SOAP                          |
| --------------------------- | ----------------------------- | ----------------------------- |
| Herramientas                | Postman, curl, navegador      | SoapUI, Postman (manual)      |
| Testing                     | Facil (curl, scripts)         | Complejo (requiere XML)       |
| Logging                     | Sencillo                      | Mas complejo                  |

## 17. Ventajas y desventajas

### SOAP

**Ventajas:**
- Estandar formal con WSDL como contrato
- Soporte nativo para seguridad (WS-Security)
- Fiabilidad en transacciones distribuidas
- Validacion automatica de tipos de datos
- Amplio soporte en herramientas empresariales

**Desventajas:**
- Mensajes XML verbosos
- Mayor complejidad de implementacion
- Requiere librerias especializadas
- Menor rendimiento por overhead de XML
- Curva de aprendizaje pronunciada

### REST

**Ventajas:**
- Simplicidad de implementacion
- Mensajes JSON ligeros y rapidos
- Utiliza HTTP de manera natural
- Facil de consumir desde cualquier cliente
- Amplia adopcion y ecosistema de herramientas

**Desventajas:**
- No tiene un contrato formal obligatorio
- Seguridad depende de mecanismos externos
- Menos estandar (cada implementacion puede variar)
- Sin soporte nativo para transacciones
- Puede ser inconsistente entre diferentes APIs

## 18. Conclusiones

1. **REST es mas sencillo de implementar:** La API REST se implemento con menos codigo, menos archivos y menor complejidad que el servicio SOAP.

2. **SOAP es mas formal y estructurado:** El WSDL proporciona un contrato claro que facilita la integracion entre sistemas heterogeneos.

3. **JSON vs XML:** La diferencia de tamano entre JSON y XML es significativa, lo que impacta directamente en el rendimiento de la comunicacion.

4. **Mano de errores:** REST utiliza codigos HTTP de manera natural, mientras que SOAP requiere un mecanismo adicional (Fault).

5. **Caso de uso:** SOAP sigue siendo relevante en entornos empresariales con requisitos de seguridad y transaccionalidad estrictos. REST es preferido para APIs web modernas donde la simplicidad y el rendimiento son prioritarios.

6. **Proyecto funcional:** Ambas implementaciones comparten los mismos datos y realizan las mismas operaciones, demostrando que es posible implementar la funcionalidad con cualquiera de las dos tecnologias.

7. **Recomendacion academica:** Para proyectos nuevos sin requisitos especificos de entornos empresariales, REST es generalmente la opcion mas practica y eficiente.
