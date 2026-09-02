const express = require('express');
const soap = require('soap');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Datos en memoria (ejemplo simple)
const libros = [
  { codigo: "LIB001", titulo: "Cien años de soledad", autor: "Gabriel García Márquez", anio: 1967 },
  { codigo: "LIB002", titulo: "Don Quijote de la Mancha", autor: "Miguel de Cervantes", anio: 1605 }
];

// 2. Lógica del Servicio SOAP
const servicioSOAP = {
  BibliotecaService: {
    BibliotecaPort: {
      ObtenerLibros: function(args) {
        return { Libros: libros };
      },
      BuscarLibro: function(args) {
        const libro = libros.find(l => l.codigo === args.Codigo);
        if (!libro) {
          throw { Fault: { Code: { Value: "soap:Server" }, Reason: { Text: "Libro no encontrado" } } };
        }
        return libro;
      }
    }
  }
};

// 3. Contrato WSDL integrado en el mismo archivo
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

  <portType name="BibliotecaPortType">
    <operation name="ObtenerLibros"><input message="tns:ObtenerLibrosMsg"/><output message="tns:ObtenerLibrosRespMsg"/></operation>
    <operation name="BuscarLibro"><input message="tns:BuscarLibroMsg"/><output message="tns:BuscarLibroRespMsg"/></operation>
  </portType>

  <binding name="BibliotecaBinding" type="tns:BibliotecaPortType">
    <soap:binding style="document" transport="http://schemas.xmlsoap.org/soap/http"/>
    <operation name="ObtenerLibros"><soap:operation soapAction="ObtenerLibros"/><input><soap:body use="literal"/></input><output><soap:body use="literal"/></output></operation>
    <operation name="BuscarLibro"><soap:operation soapAction="BuscarLibro"/><input><soap:body use="literal"/></input><output><soap:body use="literal"/></output></operation>
  </binding>

  <service name="BibliotecaService">
    <port name="BibliotecaPort" binding="tns:BibliotecaBinding">
      <soap:address location="http://localhost:3000/soap"/>
    </port>
  </service>
</definitions>
`;

// 4. Ruta web simple
app.get('/', (req, res) => {
  res.send('<h1>Ejemplo SOAP en Express</h1><p>WSDL: <a href="/soap?wsdl">/soap?wsdl</a></p>');
});

// 5. Servidor y SOAP
const servidor = http.createServer(app);

servidor.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  soap.listen(servidor, '/soap', servicioSOAP, wsdlXML);
});
