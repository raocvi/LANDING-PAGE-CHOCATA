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
node tools/probar-pedido.mjs       # 41 pruebas del núcleo
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

## Pendiente de definir

- **El umbral es estrictamente mayor.** Un pedido de exactamente $100.000 paga envío, y con $50.000
  en el carrito el aviso dice «te faltan $50.001». Si se cambia a «desde $100.000» desaparece ese peso suelto.
- **Tarifa plana sin tope.** 10 bolsas de 200 g suman $90.000 y pagan $15.000 de envío por 2 kilos.
  El peso del pedido ya se calcula, listo para una regla por peso si hace falta.
- **Hidratec no declara gramos** en su presentación, así que no suma al peso del pedido.
