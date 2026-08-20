# Prompt maestro — «Estudio»: panel de contenido editable y plantilla multi-empresa

> Úsalo tal cual en una sesión nueva (o como guía de la actual). Los bloques
> entre «» se ajustan por empresa cuando se reutilice la plantilla.

---

Actúa simultáneamente como:

- **Diseñador web senior** especializado en interfaces premium de lujo oscuro,
  responsable de que cada pantalla nueva sea indistinguible en calidad de la
  página principal ya construida.
- **Diseñador gráfico de aplicaciones web**, guardián del sistema de diseño
  existente: paleta validada para daltonismo sobre fondo #171310 (dorado
  #C68600, rosa #DC4B85, azul #4C89E8, verde #2EA45B, violeta #8F7BF2),
  tipografías Bodoni Moda (títulos) + Jost (datos y dinero), grano de fondo,
  bordes 16px, píldoras de estado con color+texto, objetivos táctiles ≥44px.
- **Ingeniero senior de marketplaces modulares y editables**, experto en
  separar contenido de código, en integridad de precios lado servidor y en
  arquitecturas sin costo fijo (serverless + almacenamiento de objetos).
- **Experto en mercadeo web y SEO**, que protege lo ya sembrado (título,
  descripción, JSON-LD de negocio local + FAQPage, sitemap, Search Console) y
  hace que todo contenido editable alimente también los datos estructurados.

Aplica las skills del proyecto: **ui-ux-pro-max** (revisión de estilo, UX y
accesibilidad de cada componente nuevo) y **dataviz** (si aparece cualquier
gráfica o indicador). Respeta las reglas ya aprendidas del repo: CSP con
hashes calculados sobre los bytes servidos, `[hidden]{display:none}` en todo
contenedor con display propio, números tabulares para dinero, cero librerías
externas nuevas, todo en español, comentarios del código con la voz del
proyecto.

## Contexto (no se rompe nada de esto)

- Tienda en producción: «www.chocata.com.co», Vercel gratuito, estático en
  `web/` + funciones en `api/` (CommonJS), pagos Wompi con verificación de
  monto en el servidor (`api/_pedido.js` calcula TODO precio desde los
  archivos del catálogo; el cliente jamás define precios).
- Almacenamiento: Vercel Blob privado (pedidos) con reflejo local en
  desarrollo (`tools/servidor-local.mjs`, carpeta `.pedidos/`).
- Administración existente: `/pedidos` (central de despachos con módulo
  logístico) y `/tablero` (analítica), ambos con clave única `ADMIN_TOKEN`
  comparada en tiempo constante, sesión en `sessionStorage`.
- Notificaciones: WhatsApp (CallMeBot) + correo Brevo con DKIM del dominio.
- Restricción dura: cupo de ~100 despliegues/día ya nos ha mordido dos veces.
  El diseño debe permitir cambios de contenido **sin redespliegue**.

## Objetivo

Construir «Estudio» (`/estudio`): un panel donde la dueña —sin saber de
código— edita el 100 % del contenido de la página, con la misma estética
premium del resto. Ella no creará más empresas: el Estudio es SU herramienta
de autonomía total sobre ESTA página. Aparte, el proyecto completo (código +
decisiones + este prompt) queda documentado como **modelo replicable desde
Claude Code**, para que el desarrollador recicle este trabajo al construir
desde cero la página de otra empresa en el futuro.

### Principio rector: «edita el QUÉ, el diseño decide el CÓMO»

El Estudio NUNCA es un lienzo libre (los lienzos libres son como se
destruyen las páginas). Es edición estructurada:

- Todo contenido vive dentro de **componentes con reglas** ya diseñados: la
  dueña cambia el texto, la foto, el precio o el orden; el componente decide
  tipografía, tamaños, márgenes y recortes. Overlaps y desbordes quedan
  estructuralmente imposibles.
- **Arrastrar y soltar** para reordenar: productos en la vitrina, beneficios,
  fotos de una galería, secciones donde aplique — reordenar sí, posicionar
  libremente no.
- **Las imágenes se ajustan solas al marco**: cada espacio (logo, fondo del
  hero, foto de producto) declara su proporción; al subir una imagen se
  recorta/escala automáticamente con previsualización del encuadre.
- **Textos con límites vivos**: cada campo conoce su máximo y muestra la
  vista previa del componente real mientras se escribe; si no cabe, no se
  puede guardar (con el mensaje claro de por qué).
- **Imposible destruir**: vista previa antes de publicar, historial con
  «volver a la versión anterior» en un clic, y si el contenido guardado se
  corrompe o falta, la página cae a sus valores por defecto y se ve intacta.

### Qué debe poder editar la dueña

1. **Productos**: crear, eliminar, ocultar y **reordenar arrastrando**;
   nombre, descripción, beneficios («comentarios» del producto),
   presentaciones/tallas con su precio y peso, etiquetas (nuevo, más
   vendido), foto principal.
2. **Precios y presentaciones**: cambio inmediato y coherente — la vitrina, el
   carrito, Sofi (la IA) y el cobro del servidor deben leer la MISMA fuente;
   ningún camino donde el cliente pague un precio viejo.
3. **Textos de la página**: hero (título, subtítulo, eyebrow), mensajes de
   secciones, textos del manifiesto, **condiciones comerciales** (pedido
   mínimo, tarifa de envío por kilo, textos legales de retracto) — estas
   últimas alimentan también el motor de cobro y a Sofi.
4. **Aviso superior** (hoy: terremoto): prender/apagar, texto, enlace, color.
5. **Imágenes**: logo, fotos de fondo, fotos de producto — subida desde el
   panel con compresión/redimensión razonable y URL pública estable.
6. **Datos del negocio**: WhatsApp, correo, ciudad, redes — que alimentan
   pie de página, Sofi y el JSON-LD de SEO.

### Arquitectura exigida

- Contenido en Blob (`contenido/sitio.json`, `contenido/productos.json`,
  imágenes públicas bajo `imagenes/`), con reflejo local en `.contenido/`
  para desarrollo. Valores por defecto = el contenido actual embebido, de
  modo que si el Blob no existe o falla, la página se ve EXACTAMENTE como hoy
  (degradación a lo estático, riesgo cero).
- `GET /api/contenido` público (con caché corto) para hidratar la página;
  `PUT /api/contenido` y `POST /api/subir-imagen` solo con `ADMIN_TOKEN`,
  validando forma y tamaño (lista blanca de campos, límites de longitud).
- El motor de cobro (`_pedido.calcular`) lee las anulaciones de precio del
  mismo contenido ANTES de cada cálculo; la firma de integridad y el webhook
  siguen validando el monto como hoy. Pruebas e2e (`tools/probar-flujo.mjs`)
  extendidas para: precio editado → checkout usa el nuevo → webhook aprueba.
- Guardado con historial: cada PUT conserva la versión anterior
  (`contenido/historial/…`) y el panel ofrece «volver a la versión anterior».
- El Estudio muestra **vista previa** antes de publicar (borrador vs
  publicado) y confirma antes de sobrescribir.

### Fases (cada una termina desplegable y probada)

1. **Textos y aviso** — Estudio con puerta de clave, editor de aviso
   (on/off/texto/enlace) y textos del hero; hidratación de la página pública.
2. **Productos y precios** — editor completo del catálogo con la cirugía del
   motor de cobro y sus pruebas e2e.
3. **Imágenes y marca** — subida de fotos, logo y fondos.
4. **Manual de replicación** — NO es un motor multiempresa: es la receta para
   que, desde Claude Code, este mismo modelo se implemente de cero para otra
   empresa. Entregable: `docs/REPLICAR-MODELO.md` con (a) el mapa de la
   arquitectura (qué archivo hace qué y por qué), (b) la lista de todo lo que
   cambia por empresa (marca, colores, catálogo, dominio, llaves, textos,
   Sofi), (c) los pasos de infraestructura en orden (repo, Vercel, Blob,
   Wompi, Brevo, dominio, DNS, Search Console) con sus trampas ya conocidas,
   y (d) el prompt inicial para arrancar la sesión de Claude Code del nuevo
   proyecto usando este repo como referencia de calidad.

### Reglas de trabajo

- Piloto en la rama `feat/estudio`; NO se toca `main` ni se despliega hasta
  aprobación explícita; todo se demuestra primero en el servidor local con
  capturas y pruebas automatizadas.
- Cada pantalla pasa la lista de ui-ux-pro-max: contraste ≥4.5:1, foco
  visible, táctiles ≥44px, móvil 375px sin scroll horizontal, estados de
  carga y error con recuperación, `prefers-reduced-motion` respetado.
- SEO: el contenido editado actualiza también título/descripción/JSON-LD
  donde aplique; nunca se degrada lo ya indexado.
- Seguridad: nada de secretos en el código ni en el panel; el token jamás en
  URLs; sanitizar todo lo que la dueña escriba antes de pintarlo (XSS);
  límites de tamaño en subidas; el Blob de contenido es privado salvo las
  imágenes.
- Presupuesto: $0 adicionales — todo dentro de los planes gratuitos actuales.

### Entregables por fase

Código + pruebas locales en verde + capturas móvil/escritorio + un manual de
uso en español simple para la dueña (`docs/MANUAL-ESTUDIO.md`) + registro de
lo aprendido para el manual de replicación.

Empieza por la fase 1 y muéstrame el resultado funcionando en local antes de
proponer el paso a producción.
