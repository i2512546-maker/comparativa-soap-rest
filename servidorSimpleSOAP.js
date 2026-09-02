const express = require('express');
const soap = require('soap');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Base de datos simulada en memoria
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
  xmlRequest: "<!-- Esperando interacción -->",
  xmlResponse: "<!-- Esperando interacción -->"
};

// Contrato WSDL oficial incrustado
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
          <xsd:element name="LibrosJson" type="xsd:string"/>
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

// Implementación del Servicio SOAP
const servicioSOAP = {
  BibliotecaService: {
    BibliotecaPort: {
      ObtenerLibros: function(args, cb, headers, req) {
        return { LibrosJson: JSON.stringify(libros) };
      },
      ConsultarDisponibilidad: function(args, cb, headers, req) {
        const libro = libros.find(l => l.isbn === args.isbn);
        if (!libro) {
          return { disponible: false, cantidad: 0, titulo: "Libro no encontrado" };
        }
        return { disponible: libro.disponibles > 0, cantidad: libro.disponibles, titulo: libro.titulo };
      },
      RegistrarPrestamo: function(args, cb, headers, req) {
        const libro = libros.find(l => l.isbn === args.isbn);
        if (!libro || libro.disponibles <= 0) {
          return { exito: false, mensaje: "No hay ejemplares disponibles para préstamo." };
        }
        libro.disponibles -= 1;
        prestamos.push({ id: prestamos.length + 1, isbn: args.isbn, usuario: args.usuario || "Usuario General", fecha: new Date().toISOString().split('T')[0], estado: "Activo" });
        return { exito: true, mensaje: "Préstamo registrado con éxito para " + (args.usuario || 'Usuario') + "." };
      },
      RegistrarDevolucion: function(args, cb, headers, req) {
        const libro = libros.find(l => l.isbn === args.isbn);
        if (!libro) {
          return { exito: false, mensaje: "ISBN no reconocido." };
        }
        if (libro.disponibles >= libro.total) {
          return { exito: false, mensaje: "Todos los ejemplares ya están en la biblioteca." };
        }
        libro.disponibles += 1;
        const prestamoActivo = prestamos.find(p => p.isbn === args.isbn && p.estado === "Activo");
        if (prestamoActivo) prestamoActivo.estado = "Devuelto";
        return { exito: true, mensaje: "Devolución registrada correctamente." };
      }
    }
  }
};

// Cliente SOAP interno
function invocarSOAP(accion, args) {
  return new Promise((resolve, reject) => {
    const host = process.env.RENDER_EXTERNAL_URL || 'http://localhost:' + PORT;
    const urlWSDL = host + '/soap?wsdl';

    soap.createClient(urlWSDL, { endpoint: host + '/soap' }, function(err, client) {
      if (err) return reject(err);

      client[accion](args, function(err, result, rawResponse, soapHeader, rawRequest) {
        if (err) return reject(err);

        ultimaTrazaSOAP = {
          operacion: accion,
          xmlRequest: rawRequest ? rawRequest.replace(/</g, '&lt;').replace(/>/g, '&gt;') : 'No disponible',
          xmlResponse: rawResponse ? rawResponse.replace(/</g, '&lt;').replace(/>/g, '&gt;') : 'No disponible'
        };

        resolve(result);
      });
    });
  });
}

// Rutas Express
app.get('/api/libros', async (req, res) => {
  try {
    const respuesta = await invocarSOAP('ObtenerLibros', {});
    const lista = JSON.parse(respuesta.LibrosJson);
    res.json({ ok: true, libros: lista, traza: ultimaTrazaSOAP });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/api/libros/disponibilidad', async (req, res) => {
  try {
    const { isbn } = req.body;
    const respuesta = await invocarSOAP('ConsultarDisponibilidad', { isbn });
    res.json({ ok: true, resultado: respuesta, traza: ultimaTrazaSOAP });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/api/prestamos', async (req, res) => {
  try {
    const { isbn, usuario } = req.body;
    const respuesta = await invocarSOAP('RegistrarPrestamo', { isbn, usuario });
    res.json({ ok: true, resultado: respuesta, traza: ultimaTrazaSOAP });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/api/devoluciones', async (req, res) => {
  try {
    const { isbn } = req.body;
    const respuesta = await invocarSOAP('RegistrarDevolucion', { isbn });
    res.json({ ok: true, resultado: respuesta, traza: ultimaTrazaSOAP });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/api/prestamos', (req, res) => {
  res.json({ ok: true, prestamos });
});

app.get('/api/traza', (req, res) => {
  res.json(ultimaTrazaSOAP);
});

// Interfaz Gráfica Educativa
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sistema de Biblioteca - Arquitectura SOAP vs REST</title>
        <style>
            :root { --primary: #2563eb; --bg: #0f172a; --card: #1e293b; --text: #f8fafc; --border: #334155; }
            body { font-family: system-ui, -apple-system, sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: 20px; }
            .container { max-width: 1100px; margin: 0 auto; }
            header { text-align: center; margin-bottom: 30px; }
            header h1 { color: #38bdf8; margin: 0 0 10px 0; }
            header p { color: #94a3b8; }
            
            .cards-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px; }
            .card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2); }
            .card h3 { margin-top: 0; color: #f43f5e; display: flex; justify-content: space-between; align-items: center; }
            .card.soap h3 { color: #38bdf8; }
            
            .badge { background: #065f46; color: #34d399; padding: 2px 8px; border-radius: 12px; font-size: 12px; }
            
            button { background: var(--primary); color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 500; transition: background 0.2s; }
            button:hover { background: #1d4ed8; }
            
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid var(--border); }
            th { color: #94a3b8; }

            .educational-panel { background: var(--card); border: 2px dashed #0284c7; border-radius: 12px; padding: 25px; margin-top: 30px; }
            .educational-panel h2 { color: #38bdf8; margin-top: 0; }
            
            .flow-diagram { display: flex; justify-content: space-between; align-items: center; background: #0f172a; padding: 15px; border-radius: 8px; margin: 15px 0; text-align: center; font-size: 13px; flex-wrap: wrap; gap: 10px; }
            .flow-step { background: #334155; padding: 8px 12px; border-radius: 6px; border: 1px solid #475569; }

            .code-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px; }
            @media (max-width: 768px) { .code-grid { grid-template-columns: 1fr; } }
            
            pre { background: #0f172a; padding: 15px; border-radius: 6px; overflow-x: auto; font-size: 12px; color: #34d399; border: 1px solid var(--border); margin: 0; max-height: 250px; }
            
            .links-section { margin-top: 20px; display: flex; gap: 15px; }
            .links-section a { color: #38bdf8; text-decoration: none; font-weight: 500; }
            .links-section a:hover { text-decoration: underline; }
            
            input, select { background: #0f172a; border: 1px solid var(--border); color: white; padding: 8px; border-radius: 6px; width: 100%; box-sizing: border-box; margin-bottom: 10px; }
        </style>
    </head>
    <body>
        <div class="container">
            <header>
                <h1>📚 Sistema de Gestión de Biblioteca (SOAP vs REST)</h1>
                <p>Demostración interactiva de arquitectura orientada a servicios utilizando contratos WSDL y XML.</p>
            </header>

            <div class="cards-grid">
                <div class="card">
                    <h3>📚 Catálogo de Libros <button onclick="cargarLibros()">Actualizar</button></h3>
                    <p>Libros disponibles en el sistema manejados mediante SOAP.</p>
                    <div id="tabla-libros-container">Cargando libros...</div>
                </div>

                <div class="card soap">
                    <h3>⚡ Operaciones SOAP <span class="badge">● Conectado</span></h3>
                    <p>Interactúa ejecutando métodos del servicio WSDL.</p>
                    
                    <label>Seleccionar Libro:</label>
                    <select id="select-isbn"></select>
                    
                    <label>Nombre de Usuario:</label>
                    <input type="text" id="input-usuario" value="Estudiante Demo" placeholder="Nombre...">

                    <div style="display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap;">
                        <button onclick="soapDisponibilidad()">🔍 Disponibilidad</button>
                        <button onclick="soapPrestamo()" style="background: #10b981;">➕ Prestar</button>
                        <button onclick="soapDevolucion()" style="background: #f59e0b;">↩️ Devolver</button>
                    </div>
                    <div id="soap-resultado" style="margin-top: 15px; font-weight: bold; color: #38bdf8; font-size: 14px;"></div>
                </div>
            </div>

            <div class="card" style="margin-bottom: 30px;">
                <h3>📖 Historial de Préstamos Activos</h3>
                <div id="tabla-prestamos-container">Cargando préstamos...</div>
            </div>

            <div class="educational-panel">
                <h2>🔍 ¿Dónde está SOAP? (Panel de Inspección XML)</h2>
                <p>Durante la exposición, puedes observar el flujo exacto de comunicación: la interfaz web hace una petición HTTP al backend en Express, y el backend <strong>se comunica con el servicio SOAP enviando y recibiendo XML Envelope crudo</strong>.</p>
                
                <div class="flow-diagram">
                    <div class="flow-step">1. Usuario (Frontend)</div>
                    <div>➔</div>
                    <div class="flow-step">2. Backend Express</div>
                    <div>➔</div>
                    <div class="flow-step">3. SOAP Request (XML)</div>
                    <div>➔</div>
                    <div class="flow-step">4. Servicio SOAP</div>
                    <div>➔</div>
                    <div class="flow-step">5. SOAP Response (XML)</div>
                </div>

                <p><strong>Última Operación Ejecutada:</strong> <span id="lbl-operacion" style="color: #38bdf8;">Ninguna</span></p>

                <div class="code-grid">
                    <div>
                        <p style="margin: 0 0 5px 0; color: #94a3b8; font-size: 13px;">📤 SOAP Request (Enviado al Servicio):</p>
                        <pre><code id="xml-req">&lt;!-- Haz clic en una operación SOAP arriba --&gt;</code></pre>
                    </div>
                    <div>
                        <p style="margin: 0 0 5px 0; color: #94a3b8; font-size: 13px;">📥 SOAP Response (Recibido del Servicio):</p>
                        <pre><code id="xml-res">&lt;!-- Aquí verás el XML de respuesta --&gt;</code></pre>
                    </div>
                </div>

                <div class="links-section">
                    <a href="/soap?wsdl" target="_blank">📄 Ver Contrato WSDL del Servicio</a>
                    <a href="/api/libros" target="_blank">📊 Ver Datos JSON (Backend API)</a>
                </div>
            </div>
        </div>

        <script>
            async function cargarLibros() {
                try {
                    const res = await fetch('/api/libros');
                    const data = await res.json();
                    if(data.ok) {
                        let html = '<table><thead><tr><th>Título</th><th>Autor</th><th>Disponibles</th></tr></thead><tbody>';
                        let selectHtml = '';
                        data.libros.forEach(l => {
                            html += '<tr><td>' + l.titulo + '</td><td>' + l.autor + '</td><td>' + l.disponibles + '/' + l.total + '</td></tr>';
                            selectHtml += '<option value="' + l.isbn + '">' + l.titulo + ' (ISBN: ' + l.isbn + ')</option>';
                        });
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
                const res = await fetch('/api/prestamos');
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

            async function actualizarTraza(traza) {
                if(!traza) return;
                document.getElementById('lbl-operacion').innerText = traza.operacion;
                document.getElementById('xml-req').innerText = traza.xmlRequest;
                document.getElementById('xml-res').innerText = traza.xmlResponse;
            }

            async function soapDisponibilidad() {
                const isbn = document.getElementById('select-isbn').value;
                const res = await fetch('/api/libros/disponibilidad', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ isbn })
                });
                const data = await res.json();
                if(data.ok) {
                    document.getElementById('soap-resultado').innerText = '📖 Resultado: ' + data.resultado.titulo + ' - ' + data.resultado.cantidad + ' ejemplar(es) disponible(s).';
                    actualizarTraza(data.traza);
                    cargarLibros();
                }
            }

            async function soapPrestamo() {
                const isbn = document.getElementById('select-isbn').value;
                const usuario = document.getElementById('input-usuario').value || 'Estudiante';
                const res = await fetch('/api/prestamos', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ isbn, usuario })
                });
                const data = await res.json();
                if(data.ok) {
                    document.getElementById('soap-resultado').innerText = '✅ ' + data.resultado.mensaje;
                    actualizarTraza(data.traza);
                    cargarLibros();
                }
            }

            async function soapDevolucion() {
                const isbn = document.getElementById('select-isbn').value;
                const res = await fetch('/api/devoluciones', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ isbn })
                });
                const data = await res.json();
                if(data.ok) {
                    document.getElementById('soap-resultado').innerText = '↩️ ' + data.resultado.mensaje;
                    actualizarTraza(data.traza);
                    cargarLibros();
                }
            }

            cargarLibros();
        </script>
    </body>
    </html>
  `);
});

const servidor = http.createServer(app);

servidor.listen(PORT, () => {
  console.log('Servidor ejecutándose en el puerto ' + PORT);
  soap.listen(servidor, '/soap', servicioSOAP, wsdlXML, function() {
    console.log('Servicio SOAP WSDL montado correctamente en /soap?wsdl');
  });
});
