# Tienda: pedidos y pagos

Rama `feat/pedidos-y-pagos`. No toca `main`: la página publicada sigue igual hasta que se fusione.

## Estado

| Pieza | Estado |
|---|---|
| Carrito con persistencia | Listo |
| Selección de presentación en la ficha | Listo |
| Checkout con validación colombiana | Listo |
| Cálculo del pedido en el servidor | Listo |
| Regla de envío | Listo |
| Combos | Listo (7 combos, precio derivado de sus componentes) |
| Pedido mínimo | Listo ($40.000, validado en servidor) |
| Firma de integridad de Wompi | Listo |
| Webhook con validación de firma | Listo |
| Guardado de pedidos | Listo (archivo local; en producción necesita Vercel Blob) |
| Consulta de estado del pedido | Listo |
| Términos, privacidad y retracto | Borrador, **falta revisión legal y datos de la empresa** |
| Cobro real | **Bloqueado**: requiere cuenta de Wompi |
| Medios de pago anunciados | Listo (PSE primero) |
| PSE activo de verdad | **Bloqueado**: hay que habilitarlo con Bancolombia |
| Aviso por WhatsApp al confirmarse un pago | Listo (**falta activar CallMeBot**, 2 minutos) |
| Sofi, asistente de preguntas | Listo (respuestas fijas siempre; **IA de Gemini al poner la llave**) |

## Probar en local

```bash
node tools/servidor-local.mjs
```

Sirve el sitio y ejecuta las funciones en `http://localhost:5174` con llaves de mentira: el checkout
arma la URL de Wompi y la firma, pero no cobra.

```bash
node tools/verificar-precios.mjs   # ficha y catálogo numérico coinciden
node tools/probar-pedido.mjs       # 105 pruebas del núcleo
node tools/probar-flujo.mjs        # 30 comprobaciones de extremo a extremo (con el servidor arriba)
```

## Salir a producción

### 1. Cuenta de Wompi

Requiere **RUT y cuenta bancaria a nombre de CHOCATA S.A.S.** Sin eso no hay llaves y no se puede cobrar.
Del panel de Wompi se sacan tres valores.

### 2. Variables de entorno

En Vercel → Settings → Environment Variables:

| Variable | Para qué | ¿Puede verse en el navegador? |
|---|---|---|
| `WOMPI_LLAVE_PUBLICA` | Identifica el comercio | Sí |
| `WOMPI_SECRETO_INTEGRIDAD` | Firma la transacción | **Jamás** |
| `WOMPI_SECRETO_EVENTOS` | Valida los eventos del webhook | **Jamás** |
| `SITIO_URL` | Retorno tras el pago | Sí |
| `BLOB_READ_WRITE_TOKEN` | Guardar pedidos | **Jamás** |
| `ADMIN_TOKEN` | Ver el pedido completo | **Jamás** |
| `WHATSAPP_AVISO_TELEFONO` | A dónde llega el aviso de pedido | No aplica |
| `WHATSAPP_AVISO_APIKEY` | Llave de CallMeBot | **Jamás** |
| `GEMINI_API_KEY` | IA de Sofi (beneficios e ingredientes) | **Jamás** |

Sin las dos primeras, el checkout responde 503 con un mensaje que invita a WhatsApp: la tienda no
queda rota, queda sin cobrar.

### 3. Guardado de pedidos

En local los pedidos se escriben en `.pedidos/`. Las funciones de Vercel **no tienen disco
persistente**: hay que crear un store de Vercel Blob y añadir `BLOB_READ_WRITE_TOKEN`. El código
cambia de implementación solo, sin tocar nada.

### 4. Medios de pago

**El Web Checkout de Wompi no acepta ningún parámetro para filtrar ni preseleccionar medios de
pago.** Muestra exactamente los que el comercio tenga activos, así que PSE no se enciende desde el
código: hay que habilitarlo con el comercial de Bancolombia al abrir la cuenta.

`web/assets/data/pagos.json` solo controla lo que se *anuncia* en el checkout. **Deben quedar ahí
únicamente los medios realmente habilitados**: anunciar uno inactivo es una promesa que el comprador
descubre rota en la pasarela.

Vale la pena insistir en PSE. Es el medio más usado en compras en línea en Colombia y cuesta cerca
de la mitad que la tarjeta:

| Pedido | Total | Tarjeta (2,65% + $700 + IVA) | PSE (~1,49%) |
|---|---|---|---|
| Despensa | $50.500 | $2.426 (4,8%) | $895 (1,8%) |
| Bienestar | $66.500 | $2.930 (4,4%) | $1.179 (1,8%) |
| Kit Fuerza | $102.000 | $4.050 (4,0%) | $1.809 (1,8%) |

El fijo de $700 pega más duro entre más pequeño el pedido. El webhook ya guarda
`payment_method_type` en cada pedido, así que la mezcla PSE/tarjeta queda medida desde el primer
pago sin tener que agregar nada.

### 5. Aviso por WhatsApp al confirmarse un pago

Cuando el webhook confirma un pago, el sistema manda un WhatsApp al +57 317 668 5235 con la
referencia, el total, las líneas, el cliente y la dirección. También avisa si un monto no cuadra
(«no despachar») y si llega un pago sin pedido.

**Activarlo toma 2 minutos, desde el celular que recibe los avisos:**

1. Agregar el número de CallMeBot **+34 621 331 709** a los contactos.
2. Enviarle por WhatsApp el mensaje: `I allow callmebot to send me messages`.
3. El bot responde con una **apikey**.
4. En Vercel → Environment Variables: `WHATSAPP_AVISO_TELEFONO = 573176685235` y
   `WHATSAPP_AVISO_APIKEY = <la llave>`. Redeploy y listo.

Sin esas variables el sistema funciona igual y solo deja en el log «WhatsApp sin configurar».
Un aviso fallido jamás tumba el webhook, y los reintentos de Wompi no duplican mensajes: solo se
avisa en la primera transición de estado.

**Honestidad sobre el proveedor:** CallMeBot es un servicio gratuito de aficionado, perfecto para
avisos al propio número, sin garantía de entrega. Si el negocio crece y el aviso se vuelve crítico,
el paso serio es la API oficial de WhatsApp Business (Meta) o Twilio; se cambia por dentro de
`api/_avisos.js` sin tocar el webhook.

### 6. La IA de Sofi (Gemini)

Sofi responde al instante con reglas fijas (precios, envíos, pagos, combos, sede). Con la llave de
Gemini configurada, las preguntas de **beneficios e ingredientes** («¿para qué sirve la
creatina?», «¿el latte tiene cafeína?») las responde la IA — pero encadenada:

- **Dos niveles de fuente.** Sobre CHOCATA y sus productos, la única fuente es el corpus de las
  fichas (`api/_conocimiento.js`). Sobre nutrición e ingredientes en general (beneficios de la
  cúrcuma, cuánta proteína necesita una persona), responde con ciencia bien establecida:
  metaanálisis, OMS, NIH, EFSA, ISSN — con orden explícita de decir «la ciencia todavía no es
  concluyente» cuando la evidencia sea débil, y de no citar modas ni remedios sin respaldo.
- Ante temas que no son de nutrición ni de la marca responde `NO_LO_SE` → Sofi cae a la
  respuesta fija o a WhatsApp.
- Palabras sencillas, máximo 90 palabras, jamás promesas médicas, ignora instrucciones
  escondidas en la pregunta del visitante.
- La llave vive solo en el servidor; el endpoint rechaza orígenes ajenos y preguntas de más de
  300 caracteres.

**Activar:** crear una llave gratis en aistudio.google.com → en Vercel poner `GEMINI_API_KEY`.
El modelo por defecto es `gemini-2.5-flash` (nivel gratuito disponible; cambiable con
`GEMINI_MODELO`). Sin la llave, Sofi funciona igual con sus respuestas fijas.

### 7. Webhook en Wompi

Registrar `https://TU-DOMINIO/api/wompi-webhook` como URL de eventos.

### 8. Hosting

Las funciones de servidor y el cobro hacen el proyecto **inequívocamente comercial**, y el plan
gratuito de Vercel solo permite uso personal. Toca Pro (20 USD/mes) o mover a Cloudflare.

### 9. Legal

Completar en `web/legal.html` el NIT, la dirección fiscal y el correo de notificaciones, y hacerlo
revisar por un abogado. Falta además la facturación electrónica DIAN.

## Decisiones que conviene conocer

**El precio lo pone el servidor.** Del navegador solo se acepta qué se quiere comprar. Hay una prueba
que manda un precio inyectado y comprueba que el cobro no cambia.

**El carrito no guarda precios.** Guarda slug, presentación y cantidad, y resuelve el valor contra el
catálogo en cada apertura. Un carrito abandonado nunca vende al precio viejo.

**Dos archivos de precios.** `products.js` tiene cadenas para mostrar y `precios.json` números para
cobrar, porque el servidor no puede importar un archivo que asigna a `window`.
`tools/verificar-precios.mjs` detecta que se separen; ya pasó una vez.

**Solo el webhook confirma el pago.** La redirección del navegador no prueba nada, por eso la página
de gracias dice «estamos confirmando» y nunca «pago exitoso». Además se compara el monto aprobado
contra el guardado: si no cuadra, el pedido queda en `REVISAR_MONTO` en vez de darse por bueno.

**El endpoint de consulta no expone datos personales.** La referencia viaja en la URL y puede quedar
en un historial; sin `ADMIN_TOKEN` solo devuelve estado, total y fecha.

## Regla de envío

**No hay envío gratis.** La empresa no puede asumir ese costo, así que el cliente paga el
despacho completo, siempre. Vitanas opera igual ($9.000 plano nacional, sin umbral); Zona FIT
regala el envío desde $100.000 pero lo asume de su margen.

Tres reglas:

0. **Pedido mínimo $40.000.** Por debajo no se puede pagar.
1. **$10.500 por kilo o fracción, en todo pedido**, mínimo un kilo. Es la tarifa real de la
   transportadora, trasladada sin recargo y sin subsidio: no es negociable.
2. Una presentación sin gramos declarados pesa **1 kilo por unidad** (conservador a propósito)
   y queda señalada en `sinPeso` hasta tener el peso real.

| Pedido | Peso | Envío | Total |
|---|---|---|---|
| 1 × 200 g ($9.000) | — | — | **Rechazado**: bajo el mínimo |
| Despensa ($40.000) | 1 kg | $10.500 | $50.500 |
| 10 × 200 g ($90.000) | 2 kg | $21.000 | $111.000 |
| 2 × creatina ($100.000) | 500 g | $10.500 | $110.500 |
| 1 × 3.500 g ($95.000) | 3,5 kg | $42.000 | $137.000 |
| 2 × granel ($190.000) | 7 kg | $73.500 | $263.500 |

Sin umbral no hay saltos raros: el total sube siempre que sube el pedido, y el peso se muestra
en el checkout («Envío (7 kilos)») para que el número tenga explicación. Los combos livianos
pesan justo un kilo para pagar el envío mínimo.

## Combos

Siete combos en `web/assets/data/combos.json`. Cada uno declara **solo su precio y qué trae**;
el precio suelto, el peso y el ahorro los deriva el servidor sumando los componentes contra
`precios.json`. No pueden quedar desfasados, y un combo cuyo componente salga del catálogo deja de
venderse solo. Una prueba comprueba que todos ahorran plata, declaran peso y superan el mínimo.

| Combo | Trae | Precio | Suelto | Ahorro | Peso |
|---|---|---|---|---|---|
| Despensa de la casa | 5 × Tradicional 200 g | $40.000 | $45.000 | 11% | 1 kg |
| Mes completo | 2 × Tradicional 1.500 g | $76.000 | $90.000 | 16% | 3 kg |
| Cata CHOCATA | Tradicional + Premium 500 g | $46.000 | $54.000 | 15% | 1 kg |
| Kit Fuerza | Proteína + Creatina | $102.000 | $120.000 | 15% | 650 g |
| Kit Rendimiento | Pre-workout + Creatina + 200 g | $76.000 | $89.000 | 15% | 650 g |
| Bienestar diario | Colágeno + Magnesio + Vitamina C | $56.000 | $65.000 | 14% | 700 g |
| Recuperación | Remolacha + Magnesio | $52.000 | $60.000 | 13% | 450 g |

**Los pesos están calculados contra el borde del kilo.** La despensa lleva cinco bolsas y no seis
a propósito: cinco pesan 1.000 g exactos y cobran un kilo; la sexta cuesta $9.000 pero empujaría el
pedido a dos kilos y subiría el envío $10.500. Al comprador le sale mejor así.

**El granel ya no regala transporte.** Sin envío gratis, dos bultos pagan sus 7 kilos completos
($73.500). Se puede armar combo de granel cuando se quiera.

**Por qué existe el tope.** Sin él el total no era monótono: once bolsas costaban $144.000 y doce
costaban $108.000. Un comprador que descubre que agregar producto le abarata el pedido deja de creer
en el precio. Con el tope, ningún pedido por debajo del umbral supera los $100.000 y el total nunca
baja al agregar producto. Hay dos pruebas que recorren el catálogo comprobando justo eso.

**No abre un hueco nuevo de costo.** Un bulto de 3,5 kg a $100.001 ya viajaba gratis; el tope
solo extiende ese mismo trato unos pesos hacia abajo, de forma continua en vez de a saltos.

El checkout muestra los kilos cuando manda el peso, y cuando manda el tope lo dice:
«tu envío costaba $60.000, pero nunca cobramos más de lo que te falta para el envío gratis».

## Auditoría de agosto de 2026

Hallazgos corregidos, del más grave al menor:

1. **Los pedidos se guardaban en Vercel Blob con `access: public`.** Cada pedido lleva nombre,
   documento, celular y dirección; un blob público es una URL legible por cualquiera que la tenga,
   y eso viola la Ley 1581. Ahora son privados y se leen con la URL firmada del token.
2. **El «tope hasta gratis» subsidiaba el envío** cerca del umbral. Se eliminó: el cliente paga el
   costo completo, como en el resto del mercado.
3. **El envío gratis regalaba transporte** (7 kilos gratis en granel): primero se le puso techo
   de 5 kilos y después se eliminó por completo, por decisión del negocio — la empresa no puede
   asumir ese costo. Hoy todo pedido paga su peso.
4. **Hidratec cobraba envío de menos** desde 2 unidades por no declarar gramos: ahora pesa 1 kilo
   por unidad hasta tener el dato real.
5. **El formulario solo aceptaba cédula (CC)**: ahora CC, CE y NIT, validados en el servidor y
   trasladados a Wompi en `legal-id-type`.

## Auditoría de seguridad (agosto de 2026)

Lo que ya estaba bien: precio y firma solo en servidor, checksum del webhook en tiempo constante,
monto del pago cruzado contra el pedido guardado, referencia con formato estricto (sin path
traversal), vista pública sin datos personales, blobs privados, `.pedidos/` fuera de git, sin
llaves reales en la historia, `gracias.html` pinta la referencia con textContent.

Lo que se corrigió en esta pasada:

1. **Content-Security-Policy** en `vercel.json`: solo scripts propios, cdn.jsdelivr.net y umami,
   con hashes SHA-256 para los tres scripts inline (sin `unsafe-inline` en scripts). **Ojo: si se
   edita cualquier `<script>` inline de `index.html` o `gracias.html`, hay que recalcular su hash
   en la CSP o el script deja de ejecutar.** También `Permissions-Policy` restrictiva.
2. **El error del catálogo ya no refleja la entrada del atacante**: slug y talla se reducen a
   caracteres inofensivos antes de volver en el mensaje, y el navegador pinta los errores del
   servidor como texto plano, nunca como HTML.
3. **Token de administración comparado en tiempo constante** (timingSafeEqual), como ya se hacía
   con el webhook.
4. **Chequeo de Origin en el checkout**: una página ajena ya no puede crear pedidos desde el
   navegador de un visitante (CSRF). Peticiones sin Origin (integraciones, pruebas) pasan.
5. **Topes de largo en los datos del comprador**: nadie puede mandar campos de un megabyte a
   engordar el almacenamiento.
6. **`package.json` con `@vercel/blob`**: sin él, el guardado en producción habría reventado al
   configurar el token (la dependencia no se instalaba).
7. **El servidor local solo escucha en 127.0.0.1**: corre sin autenticación y no tiene por qué
   verse desde la red local.

Lo que queda fuera del código y conviene saber:

- **Sin límite de tasa (rate limiting).** Un bot puede crear pedidos PENDIENTE en volumen. No
  cuesta plata (nadie paga), pero ensucia el almacén. Vercel WAF o BotID lo resuelven si pasa.
- **El token de administración viaja en una cabecera sin expirar.** Suficiente para un solo
  administrador; si algún día hay panel, toca sesión de verdad.
- **Correo de aviso al recibir pedido sigue pendiente**: hoy un pedido pagado solo se ve
  consultando el almacén.

## Pendiente de definir

- **El peso real de Hidratec.** El kilo por unidad es un supuesto conservador, no el dato.
- **Contra entrega.** Vitanas lo ofrece en Bogotá y es común en el sector; decidir si se quiere
  asumir el riesgo de rechazo en puerta.
- **Cuotas (Addi / Sistecredito).** Varias tiendas del sector financian; Wompi no lo trae.
- **Tarifa por zona.** `envios.json` lista los 33 departamentos y no se usan; la mensajería urbana
  en Cali cuesta menos que el envío nacional.
