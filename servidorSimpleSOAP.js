const express = require('express');
const soap = require('soap');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;

// Base de datos simulada en memoria
const libros = [
  { codigo: "LIB001", titulo: "Cien años de soledad", autor: "Gabriel García Márquez", anio: 1967 },
  { codigo: "LIB002", titulo: "Don Quijote de la Mancha", autor: "Miguel de Cervantes", anio: 1605 }
];

// Lógica de las operaciones del servicio SOAP
const servicioSOAP = {
  BibliotecaService: {
    BibliotecaPort: {
      ObtenerLibros: function(args) {
        return { Libros: libros };
      },
      BuscarLibro: function(args) {
        const libro = libros.find(l => l.codigo === args.Codigo);
        if (!libro) {
          throw { Fault: { Code: { Value: "soap:Server" }, Reason: { Text: "Libro no encontrado en el sistema" } } };
        }
        return libro;
      },
      RegistrarLibro: function(args) {
        const { Codigo, Titulo, Autor, Anio } = args;
        if (!Codigo || !Titulo || !Autor) {
          throw { Fault: { Code: { Value: "soap:Client" }, Reason: { Text: "Faltan campos obligatorios: Codigo, Titulo o Autor" } } };
        }
        const nuevo = { codigo: Codigo, titulo: Titulo, autor: Autor, anio: Anio || 2024 };
        libros.push(nuevo);
        return { Codigo: nuevo.codigo, Mensaje: "Libro registrado exitosamente por SOAP" };
      }
    }
  }
};

// Contrato WSDL oficial incrustado
const wsdlXML = `
<definitions name="BibliotecaService"
  targetNamespace="http://ejemplo.com/biblioteca"
  xmlns="http://schemas.xmlsoap.org/wsdl/"
  xmlns:tns="http://ejemplo.com/biblioteca"
  xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema">

  <types>
    <xsd:schema targetNamespace="http://ejemplo.com/biblioteca">
      <xsd:element name="ObtenerLibros"><xsd:complexType/></xsd:element>
      <xsd:element name="ObtenerLibrosResponse">
        <xsd:complexType><xsd:sequence><xsd:element name="Libros" maxOccurs="unbounded" type="tns:LibroType"/></xsd:sequence></xsd:complexType>
      </xsd:element>
      
      <xsd:element name="BuscarLibro"><xsd:complexType><xsd:sequence><xsd:element name="Codigo" type="xsd:string"/></xsd:sequence></xsd:complexType></xsd:element>
      <xsd:element name="BuscarLibroResponse" type="tns:LibroType"/>

      <xsd:element name="RegistrarLibro">
        <xsd:complexType><xsd:sequence>
          <xsd:element name="Codigo" type="xsd:string"/>
          <xsd:element name="Titulo" type="xsd:string"/>
          <xsd:element name="Autor" type="xsd:string"/>
          <xsd:element name="Anio" type="xsd:int" minOccurs="0"/>
        </xsd:sequence></xsd:complexType>
      </xsd:element>
      <xsd:element name="RegistrarLibroResponse">
        <xsd:complexType><xsd:sequence>
          <xsd:element name="Codigo" type="xsd:string"/>
          <xsd:element name="Mensaje" type="xsd:string"/>
        </xsd:sequence></xsd:complexType>
      </xsd:element>

      <xsd:complexType name="LibroType">
        <xsd:sequence>
          <xsd:element name="codigo" type="xsd:string"/>
          <xsd:element name="titulo" type="xsd:string"/>
          <xsd:element name="autor" type="xsd:string"/>
          <xsd:element name="anio" type="xsd:int"/>
        </xsd:sequence>
      </xsd:complexType>
    </xsd:schema>
  </types>

  <message name="ObtenerLibrosMsg"><part name="parameters" element="tns:ObtenerLibros"/></message>
  <message name="ObtenerLibrosRespMsg"><part name="parameters" element="tns:ObtenerLibrosResponse"/></message>
  <message name="BuscarLibroMsg"><part name="parameters" element="tns:BuscarLibro"/></message>
  <message name="BuscarLibroRespMsg"><part name="parameters" element="tns:BuscarLibroResponse"/></message>
  <message name="RegistrarLibroMsg"><part name="parameters" element="tns:RegistrarLibro"/></message>
  <message name="RegistrarLibroRespMsg"><part name="parameters" element="tns:RegistrarLibroResponse"/></message>

  <portType name="BibliotecaPortType">
    <operation name="ObtenerLibros"><input message="tns:ObtenerLibrosMsg"/><output message="tns:ObtenerLibrosRespMsg"/></operation>
    <operation name="BuscarLibro"><input message="tns:BuscarLibroMsg"/><output message="tns:BuscarLibroRespMsg"/></operation>
    <operation name="RegistrarLibro"><input message="tns:RegistrarLibroMsg"/><output message="tns:RegistrarLibroRespMsg"/></operation>
  </portType>

  <binding name="BibliotecaBinding" type="tns:BibliotecaPortType">
    <soap:binding style="document" transport="http://schemas.xmlsoap.org/soap/http"/>
    <operation name="ObtenerLibros"><soap:operation soapAction="ObtenerLibros"/><input><soap:body use="literal"/></input><output><soap:body use="literal"/></output></operation>
    <operation name="BuscarLibro"><soap:operation soapAction="BuscarLibro"/><input><soap:body use="literal"/></input><output><soap:body use="literal"/></output></operation>
    <operation name="RegistrarLibro"><soap:operation soapAction="RegistrarLibro"/><input><soap:body use="literal"/></input><output><soap:body use="literal"/></output></operation>
  </binding>

  <service name="BibliotecaService">
    <port name="BibliotecaPort" binding="tns:BibliotecaBinding">
      <soap:address location="http://localhost:3000/soap"/>
    </port>
  </service>
</definitions>
`;

// Interfaz web visual bonita y profesional para la raíz (/)
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <title>Ejemplo SOAP con ExpressJS</title>
        <style>
            body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 40px; display: flex; justify-content: center; }
            .card { background: #1e293b; padding: 40px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.4); max-width: 600px; width: 100%; border-top: 4px solid #38bdf8; }
            h1 { color: #38bdf8; margin-top: 0; font-size: 22px; }
            p { color: #94a3b8; line-height: 1.6; }
            .endpoints { margin: 24px 0; background: #0f172a; padding: 16px; border-radius: 8px; border: 1px solid #334155; }
            .endpoints code { color: #38bdf8; font-family: monospace; }
            .btn { display: inline-block; background: #2563eb; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 500; margin-top: 10px; }
            .btn:hover { background: #1d4ed8; }
        </style>
    </head>
    <body>
        <div class="card">
            <h1>Servicio Web SOAP en ExpressJS</h1>
            <p>Proyecto de demostración para exposición. Este servidor expone un protocolo SOAP estrictamente tipado mediante un contrato WSDL y gestiona operaciones de biblioteca.</p>
            
            <div class="endpoints">
                <p><strong>Endpoint SOAP activo:</strong><br><code>/soap</code></p>
                <p><strong>Contrato WSDL:</strong><br><code>/soap?wsdl</code></p>
            </div>

            <a class="btn" href="/soap?wsdl" target="_blank">Ver Contrato WSDL (XML)</a>
        </div>
    </body>
    </html>
  `);
});

// Inicializar Servidor HTTP e integrar la librería SOAP
const servidor = http.createServer(app);

servidor.listen(PORT, () => {
  console.log(`Servidor Express corriendo en puerto ${PORT}`);
  soap.listen(servidor, '/soap', servicioSOAP, wsdlXML, function() {
    console.log('Servicio SOAP inicializado correctamente en /soap');
  });
});
