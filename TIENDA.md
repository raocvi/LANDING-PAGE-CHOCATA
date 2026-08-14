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
| Aviso por correo al recibir un pedido | Pendiente |

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

### 5. Webhook en Wompi

Registrar `https://TU-DOMINIO/api/wompi-webhook` como URL de eventos.

### 6. Hosting

Las funciones de servidor y el cobro hacen el proyecto **inequívocamente comercial**, y el plan
gratuito de Vercel solo permite uso personal. Toca Pro (20 USD/mes) o mover a Cloudflare.

### 7. Legal

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

Cuatro reglas, en este orden:

0. **Pedido mínimo $40.000.** Por debajo no se puede pagar.
1. Gratis desde $100.000 **inclusive**.
2. Por debajo, **$10.500 por kilo o fracción**, mínimo un kilo, sin importar la cantidad de artículos.
3. **Tope:** el envío nunca cobra más de lo que falta para el envío gratis.

**De dónde sale $10.500.** Es la tarifa más alta observada en el mercado colombiano en
agosto de 2026: Interrapidísimo urbano hasta 0,5 kg. Servientrega ronda $8.500 el kilo nacional e
Interrapidísimo arranca en $4.970 vía agregador. Cubre el peor caso; al contratar tarifa corporativa
conviene bajarla en `envios.json`.

**Por qué hay pedido mínimo.** Una bolsa de $9.000 costaba $15.000 de envío: 167%. Nadie completa
esa compra y despacharla pierde plata. Es lo que hace el mercado — o mínimo, o el producto barato
solo se lista en pack.

| Pedido | Peso | Por peso | Se cobra | Total |
|---|---|---|---|---|
| 1 × 200 g ($9.000) | — | — | — | **Rechazado**: bajo el mínimo |
| Despensa ($40.000) | 1 kg | $10.500 | $10.500 | $50.500 |
| 10 × 200 g ($90.000) | 2 kg | $21.000 (2 kilos) | **$10.000** | $100.000 |
| 1 × 3.500 g ($95.000) | 3,5 kg | $42.000 (4 kilos) | **$5.000** | $100.000 |
| Kit Fuerza ($102.000) | 650 g | — | Gratis | $102.000 |

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
| Bienestar diario | Colágeno + Magnesio + Vitamina C | $56.000 | $66.000 | 15% | 700 g |
| Recuperación | Remolacha + Magnesio | $52.000 | $61.000 | 15% | 450 g |

**Los pesos están calculados contra el borde del kilo.** La despensa lleva cinco bolsas y no seis
a propósito: cinco pesan 1.000 g exactos y cobran un kilo; la sexta cuesta $9.000 pero empujaría el
pedido a dos kilos y subiría el envío $10.500. Al comprador le sale mejor así.

**No hay combo de granel.** Dos bultos de 3,5 kg suman $190.000 y pasarían el umbral, o sea 7 kilos
despachados gratis: unos $73.500 de transporte regalado. Falta ponerle techo de peso al envío
gratis antes de vender ese combo.

**Por qué existe el tope.** Sin él el total no era monótono: once bolsas costaban $144.000 y doce
costaban $108.000. Un comprador que descubre que agregar producto le abarata el pedido deja de creer
en el precio. Con el tope, ningún pedido por debajo del umbral supera los $100.000 y el total nunca
baja al agregar producto. Hay dos pruebas que recorren el catálogo comprobando justo eso.

**No abre un hueco nuevo de costo.** Un bulto de 3,5 kg a $100.001 ya viajaba gratis; el tope
solo extiende ese mismo trato unos pesos hacia abajo, de forma continua en vez de a saltos.

El checkout muestra los kilos cuando manda el peso, y cuando manda el tope lo dice:
«tu envío costaba $60.000, pero nunca cobramos más de lo que te falta para el envío gratis».

## Pendiente de definir

- **Hidratec no declara gramos.** Su presentación se llama «Presentación única», así que aporta cero
  al peso. Hoy lo salva el mínimo de un kilo, pero **dos o más unidades se cobrarían de menos**.
  Hace falta el peso neto real; el pedido lo marca en `sinPeso` para poder detectarlo.
- **El escalón de cada kilo.** Con el tope el total ya no baja nunca, pero sigue habiendo un salto
  al cruzar cada kilo. Los combos están armados para caer del lado bueno del borde; los pedidos
  sueltos no. Se suaviza cobrando por gramo en vez de por kilo.
- **Techo de peso para el envío gratis.** Hoy un pedido de $100.000 viaja gratis pese lo que pese.
  Con productos caros y livianos (creatina, colágeno) no importa; con granel sí. Sin ese techo no se
  puede vender un combo de bultos.
- **El umbral de $100.000 está 40% por encima del mercado.** MercadoLibre Colombia activa envío
  gratis desde ~$60.000. Bajarlo a $70.000 acerca la oferta al referente.
- **Tarifa por zona.** `envios.json` ya lista los 33 departamentos pero no se usan para nada.
  Cali es la ciudad de la marca y la mensajería urbana cuesta bastante menos que un envío nacional.
