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

Auditada en agosto de 2026 contra el sector de suplementos deportivos con despacho nacional:

| Referente | Envío gratis | Por debajo |
|---|---|---|
| Zona FIT (líder del sector) | desde $100.000 | $8.000 por cada 8 unidades |
| Vitanas | no ofrece | $9.000 plano nacional |
| Nutrafit | siempre | (metido en el precio) |
| **CHOCATA** | **desde $100.000, hasta 5 kilos** | **$10.500 por kilo o fracción** |

El umbral coincide con el líder. La tarifa va por peso y no plana porque el catálogo mezcla
suplementos livianos con chocolate pesado (bultos de 3,5 kg), cosa que las tiendas de referencia
no tienen. El cliente paga el costo completo del despacho: sin topes ni subsidios.

Cuatro reglas, en este orden:

0. **Pedido mínimo $40.000.** Por debajo no se puede pagar.
1. Gratis desde $100.000 **inclusive**, cubriendo **hasta 5 kilos**; los kilos por encima se
   cobran a tarifa. Sin ese techo, dos bultos de granel ($190.000, 7 kg) viajaban gratis:
   $73.500 regalados por pedido.
2. Por debajo del umbral, **$10.500 por kilo o fracción**, mínimo un kilo.
3. Una presentación sin gramos declarados pesa **1 kilo por unidad** (conservador a propósito)
   y queda señalada en `sinPeso` hasta tener el peso real.

| Pedido | Peso | Envío | Total |
|---|---|---|---|
| 1 × 200 g ($9.000) | — | — | **Rechazado**: bajo el mínimo |
| Despensa ($40.000) | 1 kg | $10.500 | $50.500 |
| 10 × 200 g ($90.000) | 2 kg | $21.000 | $111.000 |
| 1 × 3.500 g ($95.000) | 3,5 kg | $42.000 | $137.000 |
| Kit Fuerza ($102.000) | 650 g | Gratis | $102.000 |
| 2 × granel ($190.000) | 7 kg | $21.000 (2 kilos extras) | $211.000 |

Existe el salto del umbral —$95.000 paga $42.000 de envío y $100.000 viaja gratis— y es una
decisión consciente: es como opera todo el sector, y el aviso «te faltan $X para el envío gratis»
lo convierte en un empujón de venta en lugar de esconderlo.

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

**Ya se puede armar combo de granel si se quiere.** El techo de 5 kilos del envío gratis cerró el
hueco que lo impedía: dos bultos hoy pagan sus 2 kilos extras ($21.000) en vez de viajar gratis.

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
3. **El envío gratis no tenía techo de peso**: techo de 5 kilos.
4. **Hidratec cobraba envío de menos** desde 2 unidades por no declarar gramos: ahora pesa 1 kilo
   por unidad hasta tener el dato real.
5. **El formulario solo aceptaba cédula (CC)**: ahora CC, CE y NIT, validados en el servidor y
   trasladados a Wompi en `legal-id-type`.

## Pendiente de definir

- **El peso real de Hidratec.** El kilo por unidad es un supuesto conservador, no el dato.
- **Contra entrega.** Vitanas lo ofrece en Bogotá y es común en el sector; decidir si se quiere
  asumir el riesgo de rechazo en puerta.
- **Cuotas (Addi / Sistecredito).** Varias tiendas del sector financian; Wompi no lo trae.
- **Tarifa por zona.** `envios.json` lista los 33 departamentos y no se usan; la mensajería urbana
  en Cali cuesta menos que el envío nacional.
- **La tarifa de $10.500 es la más cara del rango.** Zona FIT cobra ~$8.000 y Vitanas $9.000.
  Con tarifa corporativa de transportadora se puede bajar sin perder plata.
