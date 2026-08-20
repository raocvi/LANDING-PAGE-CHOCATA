# Replicar el modelo
## Cómo levantar otra tienda como esta desde Claude Code

Este documento es para el **desarrollador**, no para la dueña. CHOCATA queda
como referencia de calidad; cada cliente nuevo tiene su propio repo construido
con esta receta. No hay motor multiempresa ni configuración compartida: se
recicla el diseño, la arquitectura y las decisiones ya probadas.

---

## 1. Qué se recicla y qué se rehace

| Se recicla casi tal cual | Se rehace por cliente |
|---|---|
| Arquitectura de `api/` (núcleo de pedidos, almacén, avisos, correo, contenido, imágenes) | Catálogo: `precios.json`, `combos.json`, `envios.json` |
| Módulo logístico de `/pedidos` y el tablero de `/tablero` | Fichas de producto (`products.js`): copy, evidencia, beneficios |
| El Estudio completo (`/estudio` + `api/contenido` + `api/subir-imagen`) | Textos de fábrica en `_contenido.js` (`PREDETERMINADO`) |
| Flujo de pago Wompi con verificación de monto | Marca: paleta, tipografías, logo, fotografía |
| Suite de pruebas `tools/probar-flujo.mjs` (se ajustan los montos esperados) | Ranuras de imagen (`_imagenes.js`): proporciones de los marcos |
| Sofi: proxy a Gemini con reglas de tres niveles | Corpus del asistente y reglas del negocio |
| CSP, cabeceras, robots, sitemap, JSON-LD | Dominio, DNS, llaves, correos, WhatsApp |

**La lección de arquitectura que hace todo esto posible:** el precio nace en un
solo lugar (`precioSuelto()` en `api/_pedido.js`) y todo lo demás lo hereda.
Cuando se replique, respetar ese punto único ahorra la mitad del trabajo.

## 2. Orden de la infraestructura

Hacerlo en este orden evita rehacer pasos:

1. **Repo en GitHub** (privado) con la estructura de este proyecto.
2. **Proyecto en Vercel** conectado al repo. **Uno solo** — dos proyectos sobre
   el mismo repo terminan con llaves en el que no tiene el dominio.
3. **Blob**: Storage → Create → Blob, marcando «Add read-write token».
4. **Dominio**: comprarlo en un registrador (los `.com.co` no los vende Vercel)
   → Vercel Domains → Add Existing → pegar los registros A y CNAME en el DNS.
5. **Wompi**: cuenta de comercio → llaves de producción → `WOMPI_LLAVE_PUBLICA`,
   `WOMPI_SECRETO_INTEGRIDAD`, `WOMPI_SECRETO_EVENTOS` → configurar la URL del
   webhook (`https://dominio/api/wompi-webhook`).
6. **Brevo**: cuenta → autenticar el dominio (DKIM, DMARC y subdominio de
   marca) → crear el remitente `pedidos@dominio` → API key.
7. **WhatsApp (CallMeBot)**: activar desde el número del negocio; la pareja
   teléfono + apikey debe coincidir.
8. **Gemini**: API key en aistudio.google.com para el asistente.
9. **ADMIN_TOKEN**: inventar una clave larga (30+ caracteres). Es la llave del
   Estudio, los pedidos y el tablero.
10. **SEO**: título, descripción, JSON-LD (negocio local + FAQ), robots,
    sitemap → Search Console (verificar por DNS, enviar sitemap, solicitar
    indexación) → Perfil de Negocio de Google.

La lista completa de variables y su propósito está en
[OPERACION.md §2](OPERACION.md); la arquitectura, en [SDD.md](SDD.md).

## 3. Trampas ya pagadas (no volver a caer)

1. **Cupo de despliegues de Vercel Hobby (~100/día, ventana móvil)**: los
   pushes que lo superan se descartan **en silencio**. Si GitHub tiene commits
   y Vercel no muestra nada, es esto. Mitigación: no construir las ramas de
   trabajo (`git.deploymentEnabled` en `vercel.json`) y agrupar cambios.
2. **El botón «Redeploy» de los avisos** reconstruye el despliegue desde el
   que se abrió, no el último. Desplegar siempre con un push.
3. **CallMeBot corrompe las secuencias `$1`**: los montos van como «COP 1.000».
4. **El bloqueo por IP de Brevo** rompe los envíos: Vercel usa IPs dinámicas.
   Dejarlo apagado.
5. **`hidden` pierde contra `display:flex/grid`**: todo contenedor que se
   oculte por JavaScript necesita su regla `[hidden]{display:none}`.
6. **Hashes de la CSP**: se calculan sobre los bytes **servidos** (LF), no
   sobre el archivo local. Mantener los bloques inline en una sola línea.
7. **Gmail no permite enviar «desde» @gmail.com** por terceros: sin dominio
   propio, el remitente sale como `...brevosend.com`. El dominio propio con
   DKIM es lo que arregla la entregabilidad (iCloud es el más estricto).
8. **Los `.json` del catálogo se leen al arrancar la función**: un cambio de
   precios en archivo exige despliegue; por eso las ediciones de la dueña van
   por el Blob y no por el repo.
9. **TTL mínimo en Hostinger es 60**: usar 300.
10. **Heredocs de shell corrompen `\b` y `\n`**: las ediciones automatizadas de
    archivos se hacen con scripts `.mjs`.

## 4. Prompt inicial para el proyecto nuevo

Abrir Claude Code en el repo nuevo y arrancar con esto (ajustando lo del
cliente):

```
Vamos a construir la tienda en línea de «NOMBRE DEL NEGOCIO» (ciudad, país;
qué vende; quién está detrás). Toma como referencia de calidad y arquitectura
el proyecto CHOCATA: HTML/CSS/JS sin framework ni build, funciones
serverless en api/ (CommonJS), datos en Vercel Blob privado, pagos con
verificación del monto en el servidor, panel de despachos con módulo
logístico, tablero analítico, asistente con IA y un «Estudio» donde la dueña
edita textos, precios, productos e imágenes sin poder romper el diseño.

Trabaja con estos sombreros a la vez: diseñador web premium, diseñador
gráfico guardián del sistema visual, ingeniero senior de marketplaces
editables y experto en mercadeo/SEO. Usa las skills del proyecto
(ui-ux-pro-max para cada pantalla, dataviz para toda gráfica).

Reglas que no se negocian:
- El precio nace solo en el servidor; el navegador manda slugs y cantidades.
- Fallar cerrado: el pedido se guarda antes de mandar a pagar; un aviso
  fallido nunca tumba un webhook.
- Degradación elegante: si la IA, el correo o el contenido editable fallan,
  la tienda sigue vendiendo y se ve intacta.
- Todo en español: código, comentarios, interfaz y documentación.
- Cada pantalla pasa la revisión de accesibilidad: contraste, foco visible,
  táctiles ≥44 px, móvil de 375 px sin scroll horizontal, prefers-reduced-motion.
- Nada de datos inventados: ni testimonios, ni pagos simulados sin etiquetar.

Empieza entrevistándome sobre el negocio, el catálogo, la marca y el tono;
propón la dirección de arte; y solo entonces construye, fase por fase,
probando en local con capturas antes de desplegar.
```

## 5. Estimaciones (con este modelo ya escrito)

| Etapa | Trabajo aproximado |
|---|---|
| Marca, catálogo y landing completa | 1–2 jornadas |
| Tienda: carrito, checkout, pagos, webhook | media jornada (reciclando) |
| Panel de despachos + tablero | media jornada |
| Estudio (contenido editable) | media jornada |
| Asistente con IA y su corpus | 2–3 horas |
| Infraestructura, dominio, correo, SEO | media jornada (con el cliente al lado para las cuentas) |

## 6. Antes de entregar

- Suite `tools/probar-flujo.mjs` en verde con los montos del catálogo nuevo.
- Una compra real de prueba (monto pequeño) que llegue hasta el WhatsApp, el
  correo y el panel de despachos.
- `docs/`: SDD, OPERACION y MANUAL-ESTUDIO adaptados al cliente.
- Grafo de conocimiento generado (`graphify`) para la siguiente sesión.
- Entregar al cliente: la clave de administración por canal seguro, el manual
  del Estudio, y una llamada de 20 minutos mostrando el taller.
