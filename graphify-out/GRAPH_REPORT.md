# Graph Report - .  (2026-08-18)

## Corpus Check
- 87 files · ~339,440 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 313 nodes · 595 edges · 20 communities
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 51 edges (avg confidence: 0.59)
- Token cost: 166,761 input · 0 output

## Community Hubs (Navigation)
- Documentacion y negocio
- Motor de cobro (checkout)
- Tablero analitico
- Almacen de pedidos (Blob)
- Avisos: WhatsApp y correo
- Animaciones y pagina principal
- Carrito de compras
- Central de despachos
- Sofi (bot del sitio)
- Pruebas E2E del flujo
- Conocimiento e IA (Sofi/Gemini)
- Formulario de checkout
- Pruebas del motor de pedido
- Configuracion de Vercel
- Datos de demostracion
- Servidor local de desarrollo
- Paquete y dependencias
- Verificador de precios
- Combos de la vitrina

## God Nodes (most connected - your core abstractions)
1. `SDD — Documento de Diseño de Software` - 25 edges
2. `TIENDA.md — Pedidos y pagos` - 17 edges
3. `OPERACION.md — Runbook de operación` - 16 edges
4. `pintar()` - 12 edges
5. `filtrar()` - 12 edges
6. `pintar()` - 12 edges
7. `pintarMeses()` - 11 edges
8. `Prompt maestro «Estudio»` - 11 edges
9. `Landing principal (index.html)` - 11 edges
10. `README del proyecto` - 10 edges

## Surprising Connections (you probably didn't know these)
- `Progressive enhancement` --semantically_similar_to--> `Degradación elegante`  [INFERRED] [semantically similar]
  web/README.md → docs/SDD.md
- `Combos con precio derivado` --shares_data_with--> `api/_pedido.js (núcleo de cálculo)`  [INFERRED]
  TIENDA.md → docs/SDD.md
- `JSON-LD @graph (HealthFoodStore + WebSite + FAQPage)` --shares_data_with--> `Regla de envío ($10.500 por kilo)`  [INFERRED]
  web/index.html → TIENDA.md
- `Página legal (términos, privacidad, retracto)` --shares_data_with--> `Regla de envío ($10.500 por kilo)`  [INFERRED]
  web/legal.html → TIENDA.md
- `Página legal (términos, privacidad, retracto)` --references--> `Pedido mínimo $40.000`  [EXTRACTED]
  web/legal.html → TIENDA.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Flujo de compra: carrito → checkout → Wompi → webhook → gracias** — web_index_landing, docs_sdd_api_pedido, docs_sdd_wompi, docs_sdd_webhook, web_gracias_gracias [EXTRACTED 1.00]
- **Avisos al confirmarse un pago (WhatsApp + correo)** — docs_sdd_webhook, docs_sdd_callmebot, docs_sdd_brevo [EXTRACTED 1.00]
- **Administración con clave única ADMIN_TOKEN** — web_pedidos_central_despachos, web_tablero_tablero, docs_sdd_admin_token [EXTRACTED 1.00]

## Communities (20 total, 0 thin omitted)

### Community 0 - "Documentacion y negocio"
Cohesion: 0.10
Nodes (50): Cupo Vercel Hobby ~100 despliegues/día, Dominio chocata.com.co, Hostinger (registro y DNS), OPERACION.md — Runbook de operación, Google Search Console, Principio «edita el QUÉ, el diseño decide el CÓMO», Estudio (panel de contenido editable), Manual de replicación (REPLICAR-MODELO.md) (+42 more)

### Community 1 - "Motor de cobro (checkout)"
Cohesion: 0.13
Nodes (24): almacen, { calcular, referencia, firmaIntegridad, validarCliente, tipoDocumentoDe }, calcular(), catalogo, combos, combosVigentes(), crypto, desgloseEnvio() (+16 more)

### Community 2 - "Tablero analitico"
Cohesion: 0.26
Nodes (26): alternar(), barrasH(), cargar(), conTip(), diaDe(), dosDigitos(), esc(), estadoDe() (+18 more)

### Community 3 - "Almacen de pedidos (Blob)"
Cohesion: 0.16
Nodes (19): anotarDespacho(), crear(), fs, guardarBlob(), guardarLocal(), leer(), leerBlob(), leerLocal() (+11 more)

### Community 4 - "Avisos: WhatsApp y correo"
Cohesion: 0.12
Nodes (17): avisarWhatsApp(), cop(), mensajePedido(), armarCorreo(), cop(), enviarConfirmacion(), esc(), firmaEventoValida() (+9 more)

### Community 5 - "Animaciones y pagina principal"
Cohesion: 0.14
Nodes (14): arrancar(), buildModal(), closeModal(), conectarCompra(), distance(), fadeVisual(), hidePreloader(), medir() (+6 more)

### Community 6 - "Carrito de compras"
Cohesion: 0.24
Nodes (18): abrir(), agregar(), avisarAgregado(), cambiarCantidad(), cerrar(), construir(), depurar(), detalleCombo() (+10 more)

### Community 7 - "Central de despachos"
Cohesion: 0.30
Nodes (16): cargar(), coincide(), esc(), estadoVisual(), fecha(), filaTabla(), horasDesde(), imprimirRotulo() (+8 more)

### Community 8 - "Sofi (bot del sitio)"
Cohesion: 0.29
Nodes (14): abrir(), anexarAcciones(), burbuja(), buscarProducto(), cerrar(), construir(), medirBot(), normalizar() (+6 more)

### Community 9 - "Pruebas E2E del flujo"
Cohesion: 0.17
Nodes (4): cliente, conDespacho, listado, url

### Community 10 - "Conocimiento e IA (Sofi/Gemini)"
Cohesion: 0.29
Nodes (7): cargarFichas(), corpus(), fs, path, reglasDelNegocio(), sinHtml(), { corpus }

### Community 11 - "Formulario de checkout"
Cohesion: 0.40
Nodes (9): campo(), cerrar(), construir(), enviar(), gramosDe(), gramosLinea(), resumir(), tiraDeMedios() (+1 more)

### Community 12 - "Pruebas del motor de pedido"
Cohesion: 0.22
Nodes (6): clienteOk, fallos, invalidas, pedido, raiz, require

### Community 13 - "Configuracion de Vercel"
Cohesion: 0.22
Nodes (8): cleanUrls, feat/pedidos-y-pagos, git, deploymentEnabled, headers, outputDirectory, $schema, trailingSlash

### Community 14 - "Datos de demostracion"
Cohesion: 0.29
Nodes (7): azar(), carpeta, ciudades, elegir(), nombres, productos, raiz

### Community 15 - "Servidor local de desarrollo"
Cohesion: 0.25
Nodes (5): PUERTO, raiz, require, servidor, TIPOS

### Community 16 - "Paquete y dependencias"
Cohesion: 0.29
Nodes (6): dependencies, @vercel/blob, description, name, private, @vercel/blob

### Community 17 - "Verificador de precios"
Cohesion: 0.29
Nodes (5): catalogo, fallos, fichas, js, raiz

### Community 18 - "Combos de la vitrina"
Cohesion: 0.60
Nodes (5): comoTexto(), escapar(), gramosDe(), pesoDe(), pintar()

## Knowledge Gaps
- **67 isolated node(s):** `fs`, `path`, `fs`, `path`, `crypto` (+62 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `pintar()` connect `Central de despachos` to `Tablero analitico`, `Formulario de checkout`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `alternar()` connect `Tablero analitico` to `Central de despachos`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **What connects `fs`, `path`, `fs` to the rest of the system?**
  _67 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Documentacion y negocio` be split into smaller, more focused modules?**
  _Cohesion score 0.0988235294117647 - nodes in this community are weakly interconnected._
- **Should `Motor de cobro (checkout)` be split into smaller, more focused modules?**
  _Cohesion score 0.12535612535612536 - nodes in this community are weakly interconnected._
- **Should `Avisos: WhatsApp y correo` be split into smaller, more focused modules?**
  _Cohesion score 0.1225296442687747 - nodes in this community are weakly interconnected._
- **Should `Animaciones y pagina principal` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._