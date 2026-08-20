# SDD — Documento de Diseño de Software
## CHOCATA Colombia · www.chocata.com.co

> Documento de arquitectura para quien mantenga, extienda o replique este
> proyecto. Su gemelo operativo es [OPERACION.md](OPERACION.md) (cuentas,
> llaves, despliegue, trampas). Última revisión: 17 de agosto de 2026.

---

## 1. Resumen ejecutivo

Tienda en línea y página de marca de CHOCATA S.A.S. (Cali, Colombia):
productos de nutrición (bebidas de malta y cacao, proteína, creatina,
colágeno, magnesio, vitamina C, remolacha, Latte Dorato). Emprendimiento
fundado por una mujer con respaldo del Fondo Emprender del SENA. La sede
física cerró por el terremoto del 10 de agosto de 2026; la tienda en línea
es hoy el canal principal de ventas.

El sistema completo opera con **costo fijo $0** (planes gratuitos) más el
dominio (~$92.000 COP/año). Primera venta real procesada y despachada el
16 de agosto de 2026.

## 2. Principios de diseño

1. **Sin framework, sin build**: HTML/CSS/JS puro servido estático. Lo que
   está en el repo es lo que se sirve. Cero dependencias de compilación.
2. **El servidor es la única autoridad sobre el dinero**: el navegador jamás
   define un precio; `api/_pedido.js` recalcula todo desde el catálogo y el
   webhook cruza el monto pagado contra el pedido guardado.
3. **Fallar cerrado, avisar ruidoso**: el pedido se guarda ANTES de enviar al
   pago; un aviso (WhatsApp/correo) fallido nunca tumba un webhook; los pagos
   sin pedido conocido se guardan como huérfanos, no se descartan.
4. **Degradación elegante**: si una pieza externa falla (IA, correo,
   WhatsApp), la tienda sigue vendiendo.
5. **Todo en español**: código, comentarios, UI, documentación.

## 3. Stack y servicios

| Capa | Tecnología | Notas |
|---|---|---|
| Frontend | HTML + CSS + JS vanilla (ES5-friendly) | `web/`; animaciones GSAP + ScrollTrigger y Lenis desde jsdelivr |
| Tipografías | Bodoni Moda (títulos) + Jost (datos/dinero) | Google Fonts |
| Backend | Vercel Functions (Node, CommonJS `req/res`) | `api/*.js`; los `_privados.js` no son endpoints |
| Datos de pedidos | Vercel Blob **privado** | `pedidos/REFERENCIA.json`; local: carpeta `.pedidos/` |
| Pagos | Wompi Web Checkout (producción) | PSE + tarjetas; firma de integridad + webhook firmado |
| Correo | Brevo API transaccional | remitente `pedidos@chocata.com.co` con DKIM del dominio |
| WhatsApp aviso | CallMeBot | al número del negocio; gratis |
| IA (Sofi) | Google Gemini vía `/api/sofi` | modelo elegido dinámicamente; corpus del catálogo |
| Analítica | Vercel Analytics (+ gancho Umami listo) | eventos custom vía `medir()` |
| Dominio/DNS | Hostinger (registro) → Vercel (hosting) | apex 308 → www |
| Hosting | Vercel plan Hobby | proyecto `chocata` |

## 4. Mapa del repositorio

```
web/                    La página (estático puro)
  index.html            Landing + tienda + SEO (JSON-LD) + aviso terremoto
  gracias.html          Retorno del pago (consulta /api/pedido)
  legal.html            Términos, retracto, datos de la empresa
  pedidos.html          ADMIN · Central de despachos (módulo logístico)
  tablero.html          ADMIN · Tablero analítico interactivo
  estudio.html          ADMIN · Estudio: contenido editable por la dueña
  robots.txt            Bloquea /pedidos /tablero /gracias /estudio
  sitemap.xml           / y /legal
  assets/css/           style.css (marca) · tienda.css (tienda+admin) · tablero.css
  assets/js/
    main.js             Animaciones, aviso terremoto, medir()
    products.js         CATÁLOGO maestro del frontend (productos, tallas)
    carrito.js          Carrito (localStorage) + insignia
    checkout.js         Formulario de datos + llamada a /api/checkout
    combos.js           Pinta combos desde /assets/data
    bot.js              Sofi: respuestas instantáneas + puente a la IA
    pedidos.js          Central de despachos (tabla, semáforo, rótulo)
    tablero.js          Tablero: SVG a mano, filtro cruzado
    contenido.js        Hidrata la página con lo editado en el Estudio
    estudio.js          El Estudio: textos, productos, precios e imágenes
  assets/data/
    precios.json        Precios por producto/talla (fuente del servidor)
    combos.json         Combos (precio derivado, nunca escrito a mano)
    envios.json         Tarifa por kilo, pedido mínimo, departamentos
    pagos.json          Textos de medios de pago

api/                    Funciones serverless (CommonJS)
  _pedido.js            NÚCLEO: catálogo+combos+envíos, calcular(), firmas,
                        tokenValido() (comparación tiempo constante)
  _almacen.js           Guardado Blob privado / carpeta local; despachos
  _avisos.js            WhatsApp CallMeBot (reemplaza $ por «COP »)
  _correo.js            Correo Brevo: armarCorreo() + enviarConfirmacion()
  _conocimiento.js      Corpus para Sofi desde products.js + reglas vivas
  _contenido.js         Contenido editable: valores de fábrica, lista blanca,
                        guardado con versión anterior (Blob o .contenido/)
  _imagenes.js          Ranuras de imagen con la proporción de cada marco
  contenido.js          GET público / PUT admin del contenido editable
  subir-imagen.js       POST admin: recibe la foto ya recortada y la publica
  _llms.js              Ficha del negocio para asistentes de IA, con precios vivos
  llms.js               GET /llms.txt (via rewrite): la sirve en texto plano
  checkout.js           POST: valida, guarda PENDIENTE, firma URL de Wompi
  wompi-webhook.js      POST: verifica firma, cruza monto, dispara avisos
  pedido.js             GET público por referencia (para gracias.html)
  pedidos.js            GET admin: lista completa
  despachar.js          POST admin: anota guía de transportadora
  reenviar-correo.js    POST admin: reenvía confirmación de un pedido pagado
  probar-correo.js      POST admin: correo de prueba (diagnóstico Brevo)
  sofi.js               POST público: proxy a Gemini con reglas de 3 niveles

tools/                  Desarrollo y pruebas (no se despliegan)
  servidor-local.mjs    Sirve web/ + ejecuta api/ en localhost:5174
  probar-flujo.mjs      E2E: compra→webhook→despacho→reenvío→errores
  sembrar-demo.mjs      38 pedidos de demostración retrofechados
  verificar-precios.mjs Coherencia catálogo frontend vs precios.json
  probar-pedido.mjs     Prueba unitaria de calcular()

docs/                   Esta documentación
vercel.json             Rutas limpias, cabeceras (CSP con hashes), no-store
.claude/launch.json     Servidores de desarrollo (chocata-web, chocata-api)
```

## 5. Flujos críticos

### 5.1 Compra (el camino del dinero)
1. Navegador arma carrito (localStorage) → `POST /api/checkout` con items
   `{slug, talla, cantidad}` y datos del cliente. **Sin precios.**
2. `checkout.js`: valida origen (anti-CSRF), valida cliente, `calcular()`
   recalcula subtotal/envío/total desde el catálogo del servidor, genera
   referencia `CHOCATA-XXXXXXXX-XXXXXXXX`, **guarda el pedido PENDIENTE**
   (fallar cerrado) y responde la URL firmada de Wompi
   (firma = SHA-256(ref + centavos + COP + secreto de integridad)).
3. Wompi cobra (PSE/tarjeta) y redirige a `/gracias?id=...`.
4. Wompi llama `POST /api/wompi-webhook`: se valida el checksum del evento
   (timingSafeEqual), se lee el pedido guardado y se **cruza el monto**;
   si difiere → estado `REVISAR_MONTO` (nunca se despacha). Si `APPROVED`
   y es cambio real (reintentos no duplican): WhatsApp al negocio +
   correo al cliente (copia oculta al negocio).
5. `gracias.html` consulta `GET /api/pedido?referencia=` y muestra el estado.

### 5.2 Despacho
`/pedidos` (clave admin) → tabla logística → fila expandida → guía de
transportadora → `POST /api/despachar` → `despacho:{guia,fecha}` en el Blob
(campo separado del estado: un reintento tardío de Wompi no puede borrarlo).

### 5.3 Contenido editable (el Estudio)
`/estudio` (clave admin) edita textos, precios, orden, visibilidad de
productos e imágenes. `GET /api/contenido` es público y la página lo consulta
al cargar (`web/assets/js/contenido.js`) para reemplazar **solo texto plano** y
`src` de imágenes: nada de lo guardado puede inyectar HTML. `PUT` exige token,
pasa por lista blanca de campos con recortes de longitud y rangos de precio, y
conserva la versión anterior para deshacer en un clic.

Tres garantías de diseño:
- **Imposible romper**: si el Blob falta o está corrupto, `leerContenido()`
  devuelve los valores de fábrica — los mismos textos que el HTML ya trae.
- **Un solo punto de la verdad para el dinero**: `precioSuelto()` consulta las
  anulaciones antes del precio de fábrica, y el checkout las refresca antes de
  cada cálculo (`refrescarAnulaciones()`, TTL corto). Vitrina, carrito y cobro
  no pueden desalinearse; un producto oculto también se rechaza en el servidor.
- **Imágenes que no descuadran**: cada ranura declara la proporción de su marco
  (`api/_imagenes.js`) y el navegador recorta al centro y escala a esa medida
  antes de subir (WebP, ≤3 MB, firma del archivo verificada en el servidor).

### 5.4 Sofi (asistente)
Preguntas escritas van SIEMPRE primero a la IA (`POST /api/sofi`): Gemini con
instrucciones de 3 niveles — (A) datos de CHOCATA solo del corpus,
(B) nutrición general con ciencia establecida y honestidad sobre lo no
concluyente, (C) cruce composición×ciencia. Sentinela `NO_LO_SE` → respuesta
fija + botón de WhatsApp. Si la IA no responde, el bot local contesta lo
esencial (precios, envíos, saludos).

## 6. Seguridad

- **ADMIN_TOKEN**: una sola clave admin; `tokenValido()` compara en tiempo
  constante; viaja solo en el header `x-admin-token`; se recuerda por
  pestaña (sessionStorage), jamás en URLs ni en el repo.
- **CSP estricta** (vercel.json): `script-src 'self'` + jsdelivr + hashes
  SHA-256 de los 4 bloques inline (3 scripts + JSON-LD). Los hashes se
  calculan sobre los BYTES SERVIDOS (LF). Procedimiento en OPERACION.md.
- **Blob privado**: pedidos con datos personales solo legibles con el token
  del servidor (Ley 1581). Lectura vía `get()` de @vercel/blob v2.
- **Anti-XSS**: todo dato del cliente pasa por `esc()` antes de pintarse en
  las páginas admin; el eco de errores del catálogo sanitiza el slug.
- **Webhook**: GET/HEAD→200 (salud), POST sin firma con transacción→401,
  ping sin transacción→200, monto cruzado contra el pedido.
- Páginas admin con `no-store` (nunca quedan en caché) y `noindex`.

## 7. Diseño visual

Lujo oscuro: fondo #171310/#0A0806, crema #F8F3EB, dorado #F2B01E/#C68600.
Paleta de datos validada para daltonismo (skill dataviz): dorado #C68600,
rosa #DC4B85, azul #4C89E8, verde #2EA45B, violeta #8F7BF2. Reglas duras:
píldoras de estado con color+texto (nunca color solo), dinero en Jost con
números tabulares, táctiles ≥44px, `[hidden]{display:none}` en todo
contenedor con display propio, `prefers-reduced-motion` respetado.

## 8. SEO

Título/description con palabras clave (chocolate saludable, suplementos,
Cali). JSON-LD `@graph`: HealthFoodStore (Cali, fundadora mujer, Instagram),
WebSite, FAQPage (5 preguntas: envíos, productos, pagos, historia, sede y
terremoto). `robots.txt` + `sitemap.xml`. Search Console verificada por DNS;
sitemap enviado; indexación solicitada. El TXT `google-site-verification`
en el DNS **no se borra nunca**.

## 9. Limitaciones conocidas y decisiones asumidas

- **Cupo Vercel Hobby ~100 deploys/día**: los pushes sobre el límite se
  descartan en silencio. Mitigación: la rama feat no construye y los
  reintentos se automatizan. Plan B a futuro: migrar a Cloudflare.
- Dos proyectos Vercel apuntan al repo; el bueno es `chocata` (tiene las
  llaves y el dominio). `landing-page-chocata` está pendiente de borrar.
- IVA no configurado (a la espera del contador). `legal.html` sin NIT.
- El Estudio edita lo existente: crear o eliminar productos, y editar sus
  nombres y descripciones, sigue siendo trabajo de desarrollo.

## 10. Hoja de ruta

1. Fusionar el Estudio (rama `feat/estudio`) a producción y entregar el
   [manual de la dueña](MANUAL-ESTUDIO.md).
2. Estudio: crear/eliminar productos y editar sus textos y beneficios.
3. Perfil de Negocio de Google (Maps / búsquedas locales).
4. Consolidación Vercel (borrar proyecto duplicado).
5. Migración opcional a Cloudflare si el cupo de deploys vuelve a doler.
