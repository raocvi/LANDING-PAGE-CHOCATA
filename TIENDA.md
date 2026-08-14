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
| Firma de integridad de Wompi | Listo |
| Webhook con validación de firma | Listo |
| Guardado de pedidos | Listo (archivo local; en producción necesita Vercel Blob) |
| Consulta de estado del pedido | Listo |
| Términos, privacidad y retracto | Borrador, **falta revisión legal y datos de la empresa** |
| Cobro real | **Bloqueado**: requiere cuenta de Wompi |
| Aviso por correo al recibir un pedido | Pendiente |

## Probar en local

```bash
node tools/servidor-local.mjs
```

Sirve el sitio y ejecuta las funciones en `http://localhost:5174` con llaves de mentira: el checkout
arma la URL de Wompi y la firma, pero no cobra.

```bash
node tools/verificar-precios.mjs   # ficha y catálogo numérico coinciden
node tools/probar-pedido.mjs       # 50 pruebas del núcleo
node tools/probar-flujo.mjs        # 23 comprobaciones de extremo a extremo (con el servidor arriba)
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

### 4. Webhook en Wompi

Registrar `https://TU-DOMINIO/api/wompi-webhook` como URL de eventos.

### 5. Hosting

Las funciones de servidor y el cobro hacen el proyecto **inequívocamente comercial**, y el plan
gratuito de Vercel solo permite uso personal. Toca Pro (20 USD/mes) o mover a Cloudflare.

### 6. Legal

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

Gratis desde $100.000 **inclusive**. Por debajo, **$15.000 por kilo o fracción**, con un mínimo de
un kilo, sin importar la cantidad de artículos.

| Pedido | Peso | Envío | Total |
|---|---|---|---|
| 1 × 200 g ($9.000) | 200 g | $15.000 (1 kilo) | $24.000 |
| 10 × 200 g ($90.000) | 2 kg | $30.000 (2 kilos) | $120.000 |
| 1 × 3.500 g ($95.000) | 3,5 kg | $60.000 (4 kilos) | $155.000 |
| 2 × creatina ($100.000) | 500 g | Gratis | $100.000 |

El checkout muestra los kilos que se están cobrando, para que el número no parezca arbitrario.

## Pendiente de definir

- **Hidratec no declara gramos.** Su presentación se llama «Presentación única», así que aporta cero
  al peso. Hoy lo salva el mínimo de un kilo, pero **dos o más unidades se cobrarían de menos**.
  Hace falta el peso neto real; el pedido lo marca en `sinPeso` para poder detectarlo.
- **El salto en el borde.** Una bolsa de 3.500 g cuesta $95.000 y paga $60.000 de envío, pero
  agregando $5.000 más el envío queda gratis. El cliente lo va a notar. Conviene decidir si el
  formato institucional lleva otra regla.
