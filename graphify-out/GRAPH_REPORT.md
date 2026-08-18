# Graph Report - PAG WEB CHOCATA COLOMBIA  (2026-08-18)

## Corpus Check
- 49 files · ~347,361 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 390 nodes · 733 edges · 25 communities
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 60 edges (avg confidence: 0.58)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5b0a6e81`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- SDD — Documento de Diseño de Software
- _pedido.js
- tablero.js
- _almacen.js
- wompi-webhook.js
- main.js
- carrito.js
- js/pedidos.js
- bot.js
- probar-flujo.mjs
- _conocimiento.js
- js/checkout.js
- probar-pedido.mjs
- vercel.json
- sembrar-demo.mjs
- servidor-local.mjs
- package.json
- verificar-precios.mjs
- combos.js
- _contenido.js
- estudio.js
- Manual del Estudio
- Replicar el modelo

## God Nodes (most connected - your core abstractions)
1. `SDD — Documento de Diseño de Software` - 25 edges
2. `TIENDA.md — Pedidos y pagos` - 17 edges
3. `OPERACION.md — Runbook de operación` - 16 edges
4. `pintar()` - 13 edges
5. `filtrar()` - 12 edges
6. `pintar()` - 12 edges
7. `el()` - 11 edges
8. `pintarMeses()` - 11 edges
9. `Prompt maestro «Estudio»` - 11 edges
10. `Landing principal (index.html)` - 11 edges

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

## Communities (25 total, 0 thin omitted)

### Community 0 - "SDD — Documento de Diseño de Software"
Cohesion: 0.10
Nodes (50): Cupo Vercel Hobby ~100 despliegues/día, Dominio chocata.com.co, Hostinger (registro y DNS), OPERACION.md — Runbook de operación, Google Search Console, Principio «edita el QUÉ, el diseño decide el CÓMO», Estudio (panel de contenido editable), Manual de replicación (REPLICAR-MODELO.md) (+42 more)

### Community 1 - "_pedido.js"
Cohesion: 0.12
Nodes (26): almacen, { calcular, refrescarAnulaciones, referencia, firmaIntegridad, validarCliente, tipoDocumentoDe }, anulaciones, calcular(), catalogo, combos, combosVigentes(), crypto (+18 more)

### Community 2 - "tablero.js"
Cohesion: 0.26
Nodes (26): alternar(), barrasH(), cargar(), conTip(), diaDe(), dosDigitos(), esc(), estadoDe() (+18 more)

### Community 3 - "_almacen.js"
Cohesion: 0.16
Nodes (19): anotarDespacho(), crear(), fs, guardarBlob(), guardarLocal(), leer(), leerBlob(), leerLocal() (+11 more)

### Community 4 - "wompi-webhook.js"
Cohesion: 0.12
Nodes (17): avisarWhatsApp(), cop(), mensajePedido(), armarCorreo(), cop(), enviarConfirmacion(), esc(), firmaEventoValida() (+9 more)

### Community 5 - "main.js"
Cohesion: 0.14
Nodes (14): arrancar(), buildModal(), closeModal(), conectarCompra(), distance(), fadeVisual(), hidePreloader(), medir() (+6 more)

### Community 6 - "carrito.js"
Cohesion: 0.23
Nodes (19): abrir(), agregar(), aplicarEdiciones(), avisarAgregado(), cambiarCantidad(), cerrar(), construir(), depurar() (+11 more)

### Community 7 - "js/pedidos.js"
Cohesion: 0.30
Nodes (16): cargar(), coincide(), esc(), estadoVisual(), fecha(), filaTabla(), horasDesde(), imprimirRotulo() (+8 more)

### Community 8 - "bot.js"
Cohesion: 0.29
Nodes (14): abrir(), anexarAcciones(), burbuja(), buscarProducto(), cerrar(), construir(), medirBot(), normalizar() (+6 more)

### Community 9 - "probar-flujo.mjs"
Cohesion: 0.17
Nodes (4): cliente, conDespacho, listado, url

### Community 10 - "_conocimiento.js"
Cohesion: 0.29
Nodes (7): cargarFichas(), corpus(), fs, path, reglasDelNegocio(), sinHtml(), { corpus }

### Community 11 - "js/checkout.js"
Cohesion: 0.44
Nodes (8): cerrar(), construir(), enviar(), gramosDe(), gramosLinea(), resumir(), tiraDeMedios(), validarCampo()

### Community 12 - "probar-pedido.mjs"
Cohesion: 0.22
Nodes (6): clienteOk, fallos, invalidas, pedido, raiz, require

### Community 13 - "vercel.json"
Cohesion: 0.22
Nodes (8): cleanUrls, feat/pedidos-y-pagos, git, deploymentEnabled, headers, outputDirectory, $schema, trailingSlash

### Community 14 - "sembrar-demo.mjs"
Cohesion: 0.29
Nodes (7): azar(), carpeta, ciudades, elegir(), nombres, productos, raiz

### Community 15 - "servidor-local.mjs"
Cohesion: 0.25
Nodes (5): PUERTO, raiz, require, servidor, TIPOS

### Community 16 - "package.json"
Cohesion: 0.29
Nodes (6): dependencies, @vercel/blob, description, name, private, @vercel/blob

### Community 17 - "verificar-precios.mjs"
Cohesion: 0.29
Nodes (5): catalogo, fallos, fichas, js, raiz

### Community 18 - "combos.js"
Cohesion: 0.60
Nodes (5): comoTexto(), escapar(), gramosDe(), pesoDe(), pintar()

### Community 20 - "_contenido.js"
Cohesion: 0.10
Nodes (32): CATALOGO_BASE, depurar(), depurarImagenes(), depurarProductos(), deshacerContenido(), escribirBlob(), escribirLocal(), fs (+24 more)

### Community 21 - "estudio.js"
Cohesion: 0.25
Nodes (18): campo(), avisar(), cargarImagenes(), cargarProductos(), conectarCampos(), el(), entrar(), enviarImagen() (+10 more)

### Community 22 - "Manual del Estudio"
Cohesion: 0.22
Nodes (8): 1. El aviso de arriba, 2. La portada, 3. Productos y precios, 4. Imágenes y marca, Cómo editar tu página sin depender de nadie, Lo primero que hay que saber, Manual del Estudio, Preguntas frecuentes

### Community 23 - "Replicar el modelo"
Cohesion: 0.22
Nodes (8): 1. Qué se recicla y qué se rehace, 2. Orden de la infraestructura, 3. Trampas ya pagadas (no volver a caer), 4. Prompt inicial para el proyecto nuevo, 5. Estimaciones (con este modelo ya escrito), 6. Antes de entregar, Cómo levantar otra tienda como esta desde Claude Code, Replicar el modelo

## Knowledge Gaps
- **96 isolated node(s):** `fs`, `path`, `fs`, `path`, `fs` (+91 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `pintar()` connect `js/pedidos.js` to `tablero.js`, `estudio.js`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `campo()` connect `estudio.js` to `js/checkout.js`, `js/pedidos.js`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Why does `alternar()` connect `tablero.js` to `js/pedidos.js`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **What connects `fs`, `path`, `fs` to the rest of the system?**
  _96 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `SDD — Documento de Diseño de Software` be split into smaller, more focused modules?**
  _Cohesion score 0.0988235294117647 - nodes in this community are weakly interconnected._
- **Should `_pedido.js` be split into smaller, more focused modules?**
  _Cohesion score 0.11576354679802955 - nodes in this community are weakly interconnected._
- **Should `wompi-webhook.js` be split into smaller, more focused modules?**
  _Cohesion score 0.1225296442687747 - nodes in this community are weakly interconnected._