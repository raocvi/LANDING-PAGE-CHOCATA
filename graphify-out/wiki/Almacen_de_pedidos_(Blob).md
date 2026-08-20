# Almacen de pedidos (Blob)

> 23 nodes · cohesion 0.16

## Key Concepts

- **_almacen.js** (19 connections) — `api/_almacen.js`
- **anotarDespacho()** (6 connections) — `api/_almacen.js`
- **marcarEstado()** (6 connections) — `api/_almacen.js`
- **usaBlob()** (6 connections) — `api/_almacen.js`
- **guardarLocal()** (5 connections) — `api/_almacen.js`
- **leerLocal()** (5 connections) — `api/_almacen.js`
- **crear()** (4 connections) — `api/_almacen.js`
- **guardarBlob()** (4 connections) — `api/_almacen.js`
- **leer()** (4 connections) — `api/_almacen.js`
- **leerBlob()** (4 connections) — `api/_almacen.js`
- **despachar.js** (4 connections) — `api/despachar.js`
- **pedido.js** (4 connections) — `api/pedido.js`
- **api/pedidos.js** (4 connections) — `api/pedidos.js`
- **rutaLocal()** (3 connections) — `api/_almacen.js`
- **listarReferencias()** (2 connections) — `api/_almacen.js`
- **fs** (1 connections) — `api/_almacen.js`
- **path** (1 connections) — `api/_almacen.js`
- **almacen** (1 connections) — `api/despachar.js`
- **{ tokenValido }** (1 connections) — `api/despachar.js`
- **almacen** (1 connections) — `api/pedido.js`
- **{ tokenValido }** (1 connections) — `api/pedido.js`
- **almacen** (1 connections) — `api/pedidos.js`
- **{ tokenValido }** (1 connections) — `api/pedidos.js`

## Relationships

- [Motor de cobro (checkout)](Motor_de_cobro_%28checkout%29.md) (4 shared connections)
- [Avisos: WhatsApp y correo](Avisos-_WhatsApp_y_correo.md) (2 shared connections)

## Source Files

- `api/_almacen.js`
- `api/despachar.js`
- `api/pedido.js`
- `api/pedidos.js`

## Audit Trail

- EXTRACTED: 76 (86%)
- INFERRED: 12 (14%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*