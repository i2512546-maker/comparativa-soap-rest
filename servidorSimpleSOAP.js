const express = require('express');
const soap = require('soap');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =========================================================================
// 1. BASE DE DATOS EN MEMORIA (Sistema de Biblioteca)
// =========================================================================
let libros = [
  { isbn: "9781234567890", titulo: "El Principito", autor: "Antoine de Saint-Exupéry", total: 5, disponibles: 3 },
  { isbn: "9780132350884", titulo: "Clean Code", autor: "Robert C. Martin", total: 4, disponibles: 1 },
  { isbn: "9780201633610", titulo: "Design Patterns", autor: "Erich Gamma", total: 2, disponibles: 2 }
];

let prestamos = [
  { id: 1, isbn: "9781234567890", usuario: "Carlos Pérez", fecha: "2026-06-01", estado: "Activo" }
];

let ultimaTrazaSOAP = {
  operacion: "Ninguna",
  xmlRequest: "<!-- Haz clic en una operación SOAP arriba -->",
  xmlResponse: "<!-- Aquí aparecerá la respuesta XML del servicio -->"
};

// =========================================================================
// 2. CONTRATO WSDL OFICIAL (El núcleo estricto de SOAP)
// =========================================================================
const wsdlXML = `
<definitions name="BibliotecaService"
  targetNamespace="http://biblioteca.com/soap"
  xmlns="http://schemas.xmlsoap.org/wsdl/"
  xmlns:tns="http://biblioteca.com/soap"
  xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema">

  <types>
    <xsd:schema targetNamespace="http://biblioteca.com/soap">
      
      <xsd:element name="ObtenerLibros"><xsd:complexType/></xsd:element>
      <xsd:element name="ObtenerLibrosResponse">
        <xsd:complexType><xsd:sequence>
          <xsd:element name="resultadoXML" type="xsd:string"/>
        </xsd:sequence></xsd:complexType>
      </xsd:element>

      <xsd:element name="ConsultarDisponibilidad">
        <xsd:complexType><xsd:sequence>
          <xsd:element name="isbn" type="xsd:string"/>
        </xsd:sequence></xsd:complexType>
      </xsd:element>
      <xsd:element name="ConsultarDisponibilidadResponse">
        <xsd:complexType><xsd:sequence>
          <xsd:element name="disponible" type="xsd:boolean"/>
          <xsd:element name="cantidad" type="xsd:int"/>
          <xsd:element name="titulo" type="xsd:string"/>
        </xsd:sequence></xsd:complexType>
      </xsd:element>

      <xsd:element name="RegistrarPrestamo">
        <xsd:complexType><xsd:sequence>
          <xsd:element name="isbn" type="xsd:string"/>
          <xsd:element name="usuario" type="xsd:string"/>
        </xsd:sequence></xsd:complexType>
      </xsd:element>
      <xsd:element name="RegistrarPrestamoResponse">
        <xsd:complexType><xsd:sequence>
          <xsd:element name="exito" type="xsd:boolean"/>
          <xsd:element name="mensaje" type="xsd:string"/>
        </xsd:sequence></xsd:complexType>
      </xsd:element>

      <xsd:element name="RegistrarDevolucion">
        <xsd:complexType><xsd:sequence>
          <xsd:element name="isbn" type="xsd:string"/>
        </xsd:sequence></xsd:complexType>
      </xsd:element>
      <xsd:element name="RegistrarDevolucionResponse">
        <xsd:complexType><xsd:sequence>
          <xsd:element name="exito" type="xsd:boolean"/>
          <xsd:element name="mensaje" type="xsd:string"/>
        </xsd:sequence></xsd:complexType>
      </xsd:element>

    </xsd:schema>
  </types>

  <message name="ObtenerLibrosMsg"><part name="parameters" element="tns:ObtenerLibros"/></message>
  <message name="ObtenerLibrosRespMsg"><part name="parameters" element="tns:ObtenerLibrosResponse"/></message>
  <message name="ConsultarDisponibilidadMsg"><part name="parameters" element="tns:ConsultarDisponibilidad"/></message>
  <message name="ConsultarDisponibilidadRespMsg"><part name="parameters" element="tns:ConsultarDisponibilidadResponse"/></message>
  <message name="RegistrarPrestamoMsg"><part name="parameters" element="tns:RegistrarPrestamo"/></message>
  <message name="RegistrarPrestamoRespMsg"><part name="parameters" element="tns:RegistrarPrestamoResponse"/></message>
  <message name="RegistrarDevolucionMsg"><part name="parameters" element="tns:RegistrarDevolucion"/></message>
  <message name="RegistrarDevolucionRespMsg"><part name="parameters" element="tns:RegistrarDevolucionResponse"/></message>

  <portType name="BibliotecaPortType">
    <operation name="ObtenerLibros"><input message="tns:ObtenerLibrosMsg"/><output message="tns:ObtenerLibrosRespMsg"/></operation>
    <operation name="ConsultarDisponibilidad"><input message="tns:ConsultarDisponibilidadMsg"/><output message="tns:ConsultarDisponibilidadRespMsg"/></operation>
    <operation name="RegistrarPrestamo"><input message="tns:RegistrarPrestamoMsg"/><output message="tns:RegistrarPrestamoRespMsg"/></operation>
    <operation name="RegistrarDevolucion"><input message="tns:RegistrarDevolucionMsg"/><output message="tns:RegistrarDevolucionRespMsg"/></operation>
  </portType>

  <binding name="BibliotecaBinding" type="tns:BibliotecaPortType">
    <soap:binding style="document" transport="http://schemas.xmlsoap.org/soap/http"/>
    <operation name="ObtenerLibros"><soap:operation soapAction="ObtenerLibros"/><input><soap:body use="literal"/></input><output><soap:body use="literal"/></output></operation>
    <operation name="ConsultarDisponibilidad"><soap:operation soapAction="ConsultarDisponibilidad"/><input><soap:body use="literal"/></input><output><soap:body use="literal"/></output></operation>
    <operation name="RegistrarPrestamo"><soap:operation soapAction="RegistrarPrestamo"/><input><soap:body use="literal"/></input><output><soap:body use="literal"/></output></operation>
    <operation name="RegistrarDevolucion"><soap:operation soapAction="RegistrarDevolucion"/><input><soap:body use="literal"/></input><output><soap:body use="literal"/></output></operation>
  </binding>

  <service name="BibliotecaService">
    <port name="BibliotecaPort" binding="tns:BibliotecaBinding">
      <soap:address location="http://localhost:3000/soap"/>
    </port>
  </service>
</definitions>
`;

// =========================================================================
// 3. LÓGICA DE NEGOCIO DEL SERVICIO SOAP (Respuestas puras en XML/Estructura SOAP)
// =========================================================================
const servicioSOAP = {
  BibliotecaService: {
    BibliotecaPort: {
      
      ObtenerLibros: function(args, cb, headers, req) {
        // Generar un XML estructurado directamente para demostrar SOAP puro
        let xmlLibros = "<ListaLibros>";
        libros.forEach(l => {
          xmlLibros += \`<Libro><ISBN>\${l.isbn}</ISBN><Titulo>\${l.titulo}</Titulo><Autor>\${l.autor}</Autor><Disponibles>\${l.disponibles}</Disponibles></Libro>\`;
        });
        xmlLibros += "</ListaLibros>";
        return { resultadoXML: xmlLibros };
      },

      ConsultarDisponibilidad: function(args, cb, headers, req) {
        const libro = libros.find(l => l.isbn === args.isbn);
        if (!libro) {
          throw { Fault: { Code: { Value: "soap:Server" }, Reason: { Text: "Libro no encontrado en el sistema SOAP" } } };
        }
        return { disponible: libro.disponibles > 0, cantidad: libro.disponibles, titulo: libro.titulo };
      },

      RegistrarPrestamo: function(args, cb, headers, req) {
        const libro = libros.find(l => l.isbn === args.isbn);
        if (!libro || libro.disponibles <= 0) {
          throw { Fault: { Code: { Value: "soap:Client" }, Reason: { Text: "Stock agotado: No hay ejemplares disponibles para préstamo." } } };
        }
        libro.disponibles -= 1;
        prestamos.push({ 
          id: prestamos.length + 1, 
          isbn: args.isbn, 
          usuario: args.usuario || "Usuario General", 
          fecha: new Date().toISOString().split('T')[0], 
          estado: "Activo" 
        });
        return { exito: true, mensaje: "Préstamo registrado vía SOAP con éxito para " + (args.usuario || 'Usuario') + "." };
      },

      RegistrarDevolucion: function(args, cb, headers, req) {
        const libro = libros.find(l => l.isbn === args.isbn);
        if (!libro) {
          throw { Fault: { Code: { Value: "soap:Client" }, Reason: { Text: "ISBN no reconocido en el contrato SOAP." } } };
        }
        if (libro.disponibles >= libro.total) {
          throw { Fault: { Code: { Value: "soap:Client" }, Reason: { Text: "Error: Todos los ejemplares ya se encuentran en la biblioteca." } } };
        }
        libro.disponibles += 1;
        const prestamoActivo = prestamos.find(p => p.isbn === args.isbn && p.estado === "Activo");
        if (prestamoActivo) prestamoActivo.estado = "Devuelto";
        return { exito: true, mensaje: "Devolución procesada correctamente por el servicio SOAP." };
      }

    }
  }
};

// =========================================================================
// 4. CLIENTE SOAP INTERNO
// =========================================================================
function invocarSOAP(accion, args) {
  return new Promise((resolve, reject) => {
    const host = process.env.RENDER_EXTERNAL_URL || 'http://localhost:' + PORT;
    const urlWSDL = host + '/soap?wsdl';

    soap.createClient(urlWSDL, { endpoint: host + '/soap' }, function(err, client) {
      if (err) return reject(err);

      client[accion](args, function(err, result, rawResponse, soapHeader, rawRequest) {
        if (err) {
          // Capturar SOAP Fault si ocurre
          ultimaTrazaSOAP = {
            operacion: accion,
            xmlRequest: rawRequest ? rawRequest : 'No disponible',
            xmlResponse: rawResponse ? rawResponse : 'Error SOAP Fault detectado'
          };
          return reject(err);
        }

        ultimaTrazaSOAP = {
          operacion: accion,
          xmlRequest: rawRequest ? rawRequest : 'No disponible',
          xmlResponse: rawResponse ? rawResponse : 'No disponible'
        };

        resolve(result);
      });
    });
  });
}

// =========================================================================
// 5. ENDPOINTS DE LA APLICACIÓN (100% basados en comunicación SOAP)
// =========================================================================
app.get('/api/soap/libros', async (req, res) => {
  try {
    const respuesta = await invocarSOAP('ObtenerLibros', {});
    res.json({ ok: true, xmlBruto: respuesta.resultadoXML, traza: ultimaTrazaSOAP });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message, traza: ultimaTrazaSOAP });
  }
});

app.post('/api/soap/disponibilidad', async (req, res) => {
  try {
    const { isbn } = req.body;
    const respuesta = await invocarSOAP('ConsultarDisponibilidad', { isbn });
    res.json({ ok: true, resultado: respuesta, traza: ultimaTrazaSOAP });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message, traza: ultimaTrazaSOAP });
  }
});

app.post('/api/soap/prestamos', async (req, res) => {
  try {
    const { isbn, usuario } = req.body;
    const respuesta = await invocarSOAP('RegistrarPrestamo', { isbn, usuario });
    res.json({ ok: true, resultado: respuesta, traza: ultimaTrazaSOAP });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message, traza: ultimaTrazaSOAP });
  }
});

app.post('/api/soap/devoluciones', async (req, res) => {
  try {
    const { isbn } = req.body;
    const respuesta = await invocarSOAP('RegistrarDevolucion', { isbn });
    res.json({ ok: true, resultado: respuesta, traza: ultimaTrazaSOAP });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message, traza: ultimaTrazaSOAP });
  }
});

app.get('/api/soap/historial-prestamos', (req, res) => {
  res.json({ ok: true, prestamos });
});

app.get('/api/soap/traza', (req, res) => {
  res.json(ultimaTrazaSOAP);
});

// =========================================================================
// 6. INTERFAZ GRÁFICA PURA SOAP
// =========================================================================
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sistema Empresarial SOAP - Biblioteca</title>
        <style>
            :root { --primary: #0284c7; --bg: #0f172a; --card: #1e293b; --text: #f8fafc; --border: #334155; }
            body { font-family: system-ui, -apple-system, sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: 20px; }
            .container { max-width: 1100px; margin: 0 auto; }
            header { text-align: center; margin-bottom: 30px; }
            header h1 { color: #38bdf8; margin: 0 0 10px 0; }
            header p { color: #94a3b8; }
            
            .cards-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px; }
            .card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2); }
            .card h3 { margin-top: 0; color: #38bdf8; display: flex; justify-content: space-between; align-items: center; }
            
            .badge { background: #065f46; color: #34d399; padding: 2px 8px; border-radius: 12px; font-size: 12px; }
            
            button { background: var(--primary); color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 500; transition: background 0.2s; }
            button:hover { background: #0369a1; }
            
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid var(--border); }
            th { color: #94a3b8; }

            .educational-panel { background: var(--card); border: 2px dashed #0284c7; border-radius: 12px; padding: 25px; margin-top: 30px; }
            .educational-panel h2 { color: #38bdf8; margin-top: 0; }
            
            .flow-diagram { display: flex; justify-content: space-between; align-items: center; background: #0f172a; padding: 15px; border-radius: 8px; margin: 15px 0; text-align: center; font-size: 13px; flex-wrap: wrap; gap: 10px; }
            .flow-step { background: #334155; padding: 8px 12px; border-radius: 6px; border: 1px solid #475569; }

            .code-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px; }
            @media (max-width: 768px) { .code-grid { grid-template-columns: 1fr; } }
            
            pre { background: #0f172a; padding: 15px; border-radius: 6px; overflow-x: auto; font-family: monospace; font-size: 12px; color: #34d399; border: 1px solid var(--border); margin: 0; max-height: 250px; white-space: pre-wrap; word-break: break-all; }
            
            .links-section { margin-top: 20px; display: flex; gap: 15px; }
            .links-section a { color: #38bdf8; text-decoration: none; font-weight: 500; }
            .links-section a:hover { text-decoration: underline; }
            
            input, select { background: #0f172a; border: 1px solid var(--border); color: white; padding: 8px; border-radius: 6px; width: 100%; box-sizing: border-box; margin-bottom: 10px; }
            .explanation-box { background: #0f172a; border-left: 4px solid #38bdf8; padding: 15px; margin: 15px 0; border-radius: 0 6px 6px 0; font-size: 14px; color: #cbd5e1; }
        </style>
    </head>
    <body>
        <div class="container">
            <header>
                <h1>🏛️ Sistema de Biblioteca Basado en SOAP</h1>
                <p>Demostración estricta de Servicios Web SOAP, Contratos WSDL y Mensajería XML Envelope.</p>
            </header>

            <div class="cards-grid">
                <div class="card">
                    <h3>📚 Catálogo SOAP <button onclick="cargarLibrosSOAP()">Consultar WSDL</button></h3>
                    <p>Datos obtenidos directamente mediante el servicio XML SOAP.</p>
                    <div id="tabla-libros-container">Cargando catálogo SOAP...</div>
                </div>

                <div class="card">
                    <h3>⚡ Operaciones del Servicio <span class="badge">WSDL Activo</span></h3>
                    <p>Ejecuta métodos definidos formalmente en el contrato.</p>
                    
                    <label>Seleccionar Libro (ISBN):</label>
                    <select id="select-isbn"></select>
                    
                    <label>Nombre de Usuario:</label>
                    <input type="text" id="input-usuario" value="Estudiante SOAP" placeholder="Nombre...">

                    <div style="display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap;">
                        <button onclick="soapDisponibilidad()">🔍 Disponibilidad</button>
                        <button onclick="soapPrestamo()" style="background: #10b981;">➕ Prestar</button>
                        <button onclick="soapDevolucion()" style="background: #f59e0b;">↩️ Devolver</button>
                    </div>
                    <div id="soap-resultado" style="margin-top: 15px; font-weight: bold; color: #38bdf8; font-size: 14px;"></div>
                </div>
            </div>

            <div class="card" style="margin-bottom: 30px;">
                <h3>📖 Historial de Préstamos SOAP</h3>
                <div id="tabla-prestamos-container">Cargando historial...</div>
            </div>

            <div class="educational-panel">
                <h2>🔍 Panel de Inspección de Tráfico SOAP (XML Envelope)</h2>
                
                <div class="explanation-box">
                    <strong>💡 Arquitectura SOAP Pura:</strong> 
                    Toda la comunicación en este sistema viaja empaquetada estrictamente en <strong>Sobres XML (Envelope)</strong> definidos por el contrato WSDL. Aquí puedes inspeccionar en tiempo real el XML que se envía y se recibe del servicio.
                </div>

                <div class="flow-diagram">
                    <div class="flow-step">1. Interfaz Web</div>
                    <div>➔</div>
                    <div class="flow-step">2. Cliente SOAP</div>
                    <div>➔</div>
                    <div class="flow-step">3. SOAP Request (XML)</div>
                    <div>➔</div>
                    <div class="flow-step">4. Servidor SOAP</div>
                    <div>➔</div>
                    <div class="flow-step">5. SOAP Response (XML)</div>
                </div>

                <p><strong>Última Operación SOAP Ejecutada:</strong> <span id="lbl-operacion" style="color: #38bdf8;">Ninguna</span></p>

                <div class="code-grid">
                    <div>
                        <p style="margin: 0 0 5px 0; color: #94a3b8; font-size: 13px;">📤 SOAP Request (Sobre XML Enviado):</p>
                        <pre><code id="xml-req">&lt;!-- Haz clic en una operación SOAP arriba --&gt;</code></pre>
                    </div>
                    <div>
                        <p style="margin: 0 0 5px 0; color: #94a3b8; font-size: 13px;">📥 SOAP Response (Sobre XML Recibido):</p>
                        <pre><code id="xml-res">&lt;!-- Aquí verás el XML de respuesta --&gt;</code></pre>
                    </div>
                </div>

                <div class="links-section">
                    <a href="/soap?wsdl" target="_blank">📄 Ver Contrato WSDL Oficial (XML)</a>
                </div>
            </div>
        </div>

        <script>
            async function cargarLibrosSOAP() {
                try {
                    const res = await fetch('/api/soap/libros');
                    const data = await res.json();
                    if(data.ok) {
                        // Parsear el string XML que viene del servicio SOAP
                        const parser = new DOMParser();
                        const xmlDoc = parser.parseFromString(data.xmlBruto, "text/xml");
                        const librosNodes = xmlDoc.getElementsByTagName("Libro");
                        
                        let html = '<table><thead><tr><th>ISBN</th><th>Título</th><th>Autor</th><th>Stock</th></tr></thead><tbody>';
                        let selectHtml = '';
                        
                        for (let i = 0; i < librosNodes.length; i++) {
                            const isbn = librosNodes[i].getElementsByTagName("ISBN")[0].textContent;
                            const titulo = librosNodes[i].getElementsByTagName("Titulo")[0].textContent;
                            const autor = librosNodes[i].getElementsByTagName("Autor")[0].textContent;
                            const disponibles = librosNodes[i].getElementsByTagName("Disponibles")[0].textContent;

                            html += '<tr><td>' + isbn + '</td><td>' + titulo + '</td><td>' + autor + '</td><td>' + disponibles + '</td></tr>';
                            selectHtml += '<option value="' + isbn + '">' + titulo + ' (ISBN: ' + isbn + ')</option>';
                        }
                        
                        html += '</tbody></table>';
                        document.getElementById('tabla-libros-container').innerHTML = html;
                        document.getElementById('select-isbn').innerHTML = selectHtml;
                        actualizarTraza(data.traza);
                    }
                    cargarPrestamos();
                } catch(e) {
                    console.error(e);
                }
            }

            async function cargarPrestamos() {
                const res = await fetch('/api/soap/historial-prestamos');
                const data = await res.json();
                if(data.ok) {
                    let html = '<table><thead><tr><th>ISBN</th><th>Usuario</th><th>Fecha</th><th>Estado</th></tr></thead><tbody>';
                    data.prestamos.forEach(p => {
                        html += '<tr><td>' + p.isbn + '</td><td>' + p.usuario + '</td><td>' + p.fecha + '</td><td>' + p.estado + '</td></tr>';
                    });
                    html += '</tbody></table>';
                    document.getElementById('tabla-prestamos-container').innerHTML = html;
                }
            }

            function actualizarTraza(traza) {
                if(!traza) return;
                document.getElementById('lbl-operacion').innerText = traza.operacion;
                
                document.getElementById('xml-req').innerText = traza.xmlRequest;
                document.getElementById('xml-res').innerText = traza.xmlResponse;
            }

            async function soapDisponibilidad() {
                const isbn = document.getElementById('select-isbn').value;
                const res = await fetch('/api/soap/disponibilidad', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ isbn })
                });
                const data = await res.json();
                if(data.ok) {
                    document.getElementById('soap-resultado').innerText = '📖 ' + data.resultado.titulo + ' - ' + data.resultado.cantidad + ' ejemplar(es) disponible(s).';
                    actualizarTraza(data.traza);
                } else {
                    document.getElementById('soap-resultado').innerText = '❌ Error SOAP Fault';
                    actualizarTraza(data.traza);
                }
            }

            async function soapPrestamo() {
                const isbn = document.getElementById('select-isbn').value;
                const usuario = document.getElementById('input-usuario').value || 'Estudiante';
                const res = await fetch('/api/soap/prestamos', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ isbn, usuario })
                });
                const data = await res.json();
                if(data.ok) {
                    document.getElementById('soap-resultado').innerText = '✅ ' + data.resultado.mensaje;
                    actualizarTraza(data.traza);
                    cargarLibrosSOAP();
                } else {
                    document.getElementById('soap-resultado').innerText = '❌ Error SOAP Fault';
                    actualizarTraza(data.traza);
                }
            }

            async function soapDevolucion() {
                const isbn = document.getElementById('select-isbn').value;
                const res = await fetch('/api/soap/devoluciones', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ isbn })
                });
                const data = await res.json();
                if(data.ok) {
                    document.getElementById('soap-resultado').innerText = '↩️ ' + data.resultado.mensaje;
                    actualizarTraza(data.traza);
                    cargarLibrosSOAP();
                } else {
                    document.getElementById('soap-resultado').innerText = '❌ Error SOAP Fault';
                    actualizarTraza(data.traza);
                }
            }

            cargarLibrosSOAP();
        </script>
    </body>
    </html>
  `);
});

// =========================================================================
// 7. INICIALIZACIÓN DEL SERVIDOR HTTP Y MONTAJE DEL SERVICIO SOAP
// =========================================================================
const servidor = http.createServer(app);

servidor.listen(PORT, () => {
  console.log('Servidor SOAP puro ejecutándose en el puerto ' + PORT);
  
  soap.listen(servidor, '/soap', servicioSOAP, wsdlXML, function() {
    console.log('Servicio SOAP WSDL montado correctamente en /soap?wsdl');
  });
});
