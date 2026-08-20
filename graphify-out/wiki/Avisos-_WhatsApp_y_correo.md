# Avisos: WhatsApp y correo

> 23 nodes · cohesion 0.12

## Key Concepts

- **wompi-webhook.js** (13 connections) — `api/wompi-webhook.js`
- **_correo.js** (7 connections) — `api/_correo.js`
- **reenviar-correo.js** (7 connections) — `api/reenviar-correo.js`
- **enviarConfirmacion()** (5 connections) — `api/_correo.js`
- **probar-correo.js** (5 connections) — `api/probar-correo.js`
- **_avisos.js** (4 connections) — `api/_avisos.js`
- **armarCorreo()** (4 connections) — `api/_correo.js`
- **mensajePedido()** (3 connections) — `api/_avisos.js`
- **avisarWhatsApp()** (2 connections) — `api/_avisos.js`
- **cop()** (2 connections) — `api/_avisos.js`
- **cop()** (2 connections) — `api/_correo.js`
- **esc()** (2 connections) — `api/_correo.js`
- **firmaEventoValida()** (2 connections) — `api/_pedido.js`
- **{ enviarConfirmacion }** (1 connections) — `api/probar-correo.js`
- **{ tokenValido }** (1 connections) — `api/probar-correo.js`
- **almacen** (1 connections) — `api/reenviar-correo.js`
- **{ enviarConfirmacion }** (1 connections) — `api/reenviar-correo.js`
- **{ tokenValido }** (1 connections) — `api/reenviar-correo.js`
- **almacen** (1 connections) — `api/wompi-webhook.js`
- **{ enviarConfirmacion }** (1 connections) — `api/wompi-webhook.js`
- **{ firmaEventoValida }** (1 connections) — `api/wompi-webhook.js`
- **{ mensajePedido, avisarWhatsApp }** (1 connections) — `api/wompi-webhook.js`
- **resumenTx()** (1 connections) — `api/wompi-webhook.js`

## Relationships

- [Motor de cobro (checkout)](Motor_de_cobro_%28checkout%29.md) (4 shared connections)
- [Almacen de pedidos (Blob)](Almacen_de_pedidos_%28Blob%29.md) (2 shared connections)

## Source Files

- `api/_avisos.js`
- `api/_correo.js`
- `api/_pedido.js`
- `api/probar-correo.js`
- `api/reenviar-correo.js`
- `api/wompi-webhook.js`

## Audit Trail

- EXTRACTED: 59 (87%)
- INFERRED: 9 (13%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*