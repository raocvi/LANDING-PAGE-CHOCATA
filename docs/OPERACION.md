# OPERACIÓN — Runbook de CHOCATA
## Cuentas, llaves, despliegue, mantenimiento y migración

> El manual del operador. Si el SDD dice CÓMO está construido, este dice
> DÓNDE vive cada cosa y QUÉ hacer cuando algo pasa. **Aquí no hay ningún
> secreto escrito** — solo dónde encontrarlos. Última revisión: 17 ago 2026.

---

## 1. Inventario de cuentas y servicios

| Servicio | Para qué | Dónde entrar | Cuenta |
|---|---|---|---|
| **GitHub** | Código fuente | github.com → repo `raocvi/LANDING-PAGE-CHOCATA` | del desarrollador |
| **Vercel** | Hosting + funciones + Blob + variables | vercel.com → proyecto **`chocata`** | raulvilladiegoochoa-5323 (Hobby) |
| **Hostinger** | Registro del dominio + DNS | hpanel.hostinger.com → Dominios → chocata.com.co | raul.villadiego.ochoa@gmail.com |
| **Wompi** | Pasarela de pagos (producción) | comercios.wompi.co | cuenta del negocio |
| **Brevo** | Correo transaccional | app.brevo.com | login con Google (raul.villadiego...) |
| **CallMeBot** | WhatsApp de aviso al negocio | (sin panel; pareja teléfono+apikey) | activado desde +57 317 668 5235 |
| **Google Gemini** | IA de Sofi | aistudio.google.com (API keys) | cuenta Google del desarrollador |
| **Search Console** | SEO / indexación | search.google.com/search-console | propiedad `chocata.com.co` |
| **Correo del negocio** | Bandeja de la marca | Gmail → chocatacolombia@gmail.com | cuenta propia del negocio |

⚠️ Proyecto Vercel duplicado `landing-page-chocata`: apunta al mismo repo
pero SIN llaves ni dominio. Pendiente de borrar. **El bueno es `chocata`.**

## 2. Llaves y variables de entorno

**TODAS viven en un solo lugar:** Vercel → proyecto `chocata` → Settings →
**Environment Variables** (Production and Preview). Jamás en el código, el
chat o este documento.

| Variable | Qué es | Si hay que regenerarla |
|---|---|---|
| `WOMPI_LLAVE_PUBLICA` | Llave pública de producción | Panel Wompi → Desarrolladores |
| `WOMPI_SECRETO_INTEGRIDAD` | Firma de la URL de pago | Panel Wompi (misma página) |
| `WOMPI_SECRETO_EVENTOS` | Firma del webhook | Panel Wompi (misma página) |
| `BLOB_READ_WRITE_TOKEN` | Acceso al Blob de pedidos | Vercel → Storage → Blob |
| `ADMIN_TOKEN` | Clave de /pedidos, /tablero y APIs admin | Se inventa (30+ caracteres); cambiarla saca a todos |
| `GEMINI_API_KEY` | IA de Sofi | aistudio.google.com |
| `GEMINI_MODELO` | (Opcional) forzar modelo | — |
| `WHATSAPP_AVISO_TELEFONO` | 573176685235 | El número del negocio |
| `WHATSAPP_AVISO_APIKEY` | Apikey de CallMeBot | Reactivar CallMeBot DESDE ese número (la pareja debe coincidir) |
| `BREVO_API_KEY` | Envío de correos | Brevo → SMTP y API → Claves API |
| `CORREO_REMITENTE` | `pedidos@chocata.com.co` | Debe existir como remitente en Brevo |
| `CORREO_COPIA` | chocatacolombia@gmail.com (copia + respuestas) | — |
| `CORREO_NOMBRE` | «CHOCATA Colombia» | — |
| `SITIO_URL` | `https://www.chocata.com.co` | Cambia si cambia el dominio |
| `ANULACIONES_TTL_MS` | (Opcional) segundos de caché de los precios editados en el Estudio; por defecto 15 s | — |
| `CONTENIDO_DIR` | (Opcional, solo desarrollo) carpeta del contenido editable | — |

**Regla tras cambiar variables:** guardar (verificando que el ámbito quede
en «Production») y hacer un push nuevo a `main` para desplegar. **No usar el
botón «Redeploy» del aviso azul**: reconstruye el despliegue desde el que se
abrió, no el más reciente.

## 3. Dominio y DNS (Hostinger)

Dominio `chocata.com.co` · comprado 16 ago 2026 · vence 2027-08-17 ·
renovación automática ACTIVA (~$92.000/año) · titular raul.ochoa@me.com.

Registros DNS que deben existir (no borrar ninguno):

| Tipo | Nombre | Valor | Para qué |
|---|---|---|---|
| A | `@` | `216.198.79.1` | Apex → Vercel |
| CNAME | `www` | `eec8a92b5818d9a0.vercel-dns-017.com` | www → Vercel |
| TXT | `@` | `brevo-code:...` | Verificación Brevo |
| CNAME | `brevo1._domainkey` | `b1.chocata-com-co.dkim.brevo.com` | DKIM 1 |
| CNAME | `brevo2._domainkey` | `b2.chocata-com-co.dkim.brevo.com` | DKIM 2 |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=...` | DMARC |
| CNAME | `mail` | `mail-chocata-com-co.brand.brevosend.com` | Marca en enlaces |
| CNAME | `r.mail` | `...r.brand.brevosend.com` | Redirecciones |
| CNAME | `img.mail` | `...img.brand.brevosend.com` | Imágenes de correo |
| TXT | `@` | `google-site-verification=...` | Search Console (¡nunca borrar!) |

Los nameservers son los de Hostinger (lunar/solar.dns-parking.com) — no
tocar «Cambiar nameservers».

## 4. Despliegue

- **Ramas**: se trabaja en `feat/...`, se fusiona a `main`, y `main` se
  despliega solo al hacer push. La rama `feat/pedidos-y-pagos` tiene los
  builds apagados en `vercel.json` para no gastar cupo.
- **Cupo Hobby ~100 despliegues/día (ventana móvil de 24 h)**: al superarlo,
  Vercel descarta los pushes en silencio (sin error ni entrada en la lista).
  Señal: GitHub tiene commits nuevos y Deployments no muestra nada. Remedio:
  esperar a que la ventana libere y re-empujar (un commit vacío sirve).
- **Caché de estáticos**: los assets llevan `?v=NN`. Todo cambio de CSS/JS
  exige subir la versión en los 5 HTML (buscar y reemplazar `?v=NN`).
- **CSP**: si se toca un script inline o el JSON-LD, recalcular su hash
  SHA-256 **sobre el contenido exacto entre las etiquetas tal como se
  sirve** (LF, no CRLF) y actualizar `vercel.json`. Los bloques de una sola
  línea evitan sustos de fin de línea.
- **Verificar un deploy**: `curl https://www.chocata.com.co/...` buscando el
  marcador del cambio (no confiar en la caché del navegador).

## 5. Desarrollo local

```bash
node tools/servidor-local.mjs        # web + api en http://localhost:5174
node tools/sembrar-demo.mjs          # 38 pedidos de demo en .pedidos/
node tools/probar-flujo.mjs          # E2E completo (compra→webhook→despacho)
node tools/verificar-precios.mjs     # coherencia de catálogos
```

- Sin llaves reales: el servidor local usa llaves de mentira y guarda
  pedidos en `.pedidos/` (gitignored). `ADMIN_TOKEN` local se define al
  lanzar (ver `.claude/launch.json`, config `chocata-api`).
- El flujo real de Wompi NO se puede probar en local (webhook firmado);
  para eso está el modo de pruebas de Wompi o un pago real pequeño.

## 6. Tareas de mantenimiento

| Frecuencia | Tarea |
|---|---|
| Cada venta | /pedidos → marcar despachado con guía (el semáforo avisa la urgencia) |
| Cuando cambien precios o fotos | La dueña lo hace sola en /estudio — ver [MANUAL-ESTUDIO.md](MANUAL-ESTUDIO.md); no requiere despliegue |
| Semanal | Ojear Search Console (Rendimiento) y el tablero |
| Mensual | Revisar límite Brevo (300 correos/día es holgado) y Blob |
| Anual (ago) | Verificar renovación del dominio (automática, tarjeta vigente) |
| Cuando duela | Migrar a Cloudflare (ver §8) |

**Respaldo de pedidos**: los JSON viven en el Blob de Vercel. Para exportar:
listar `pedidos/` con el token y descargar (script de 10 líneas con
`@vercel/blob list+get`; pedirlo a Claude Code cuando se necesite).

## 7. Diagnóstico rápido (síntoma → causa probable)

| Síntoma | Revisar |
|---|---|
| No llegan correos | Brevo → Estadísticas transaccional; variable `BREVO_API_KEY` re-guardada + push nuevo; ¿bloqueo por IP encendido? (debe estar APAGADO: Vercel usa IPs dinámicas) |
| No llega WhatsApp | La pareja teléfono+apikey de CallMeBot debe coincidir; reactivar desde el número del negocio |
| Push sin deploy | Cupo diario (ver §4) |
| /pedidos no carga | ¿ADMIN_TOKEN cambiado? ¿deploy pendiente? |
| Pago aprobado sin pedido | Aparece como HUÉRFANO en /pedidos; cruzar con el panel de Wompi |
| Estado `REVISAR_MONTO` | El monto pagado no cuadra con el pedido: NO despachar; revisar en Wompi |
| CSP bloquea un script | Hash desactualizado: recalcular sobre bytes servidos |
| Aviso/panel no cierra | El clásico `display` vs `hidden`: falta `[hidden]{display:none}` |
| Un cambio del Estudio no se ve | Recargar la página (el contenido se lee al cargar); los precios tardan hasta 15 s en el cobro por su caché (`ANULACIONES_TTL_MS`) |
| Una imagen subida no aparece | Revisar que el Blob tenga token de escritura; en desarrollo, que exista `.contenido/imagenes/` |

## 8. Migraciones

**A Cloudflare Pages (si el cupo de Vercel duele):** el código es estático +
funciones — se adapta a Pages Functions. Cambian: adaptador de `req/res`,
Blob → R2/KV, variables al panel de Cloudflare, DNS (A/CNAME) al nuevo
destino. Los registros de Brevo y Google NO cambian. Estimación: media
jornada de trabajo de desarrollo + pruebas.

**Cambio de dominio:** comprar → Vercel Domains (Add) → DNS → actualizar
`SITIO_URL`, `CORREO_REMITENTE` (+ dominio autenticado en Brevo), sitemap,
JSON-LD y canónicas → Search Console nueva propiedad.

**Rotación de llaves comprometidas:** regenerar en el panel del servicio →
pegar en Vercel env → push a main. Orden sin downtime: primero la nueva en
Vercel, luego revocar la vieja en el servicio.

## 9. Reglas fijas de operación

1. Los montos en mensajes de WhatsApp se escriben «COP 115.500» (nunca con
   `$`: CallMeBot corrompe las secuencias `$1`).
2. El bloqueo por direcciones IP de Brevo permanece APAGADO (Vercel usa IPs
   dinámicas).
3. Los despliegues se disparan con push a `main`; el botón «Redeploy» de los
   avisos no se usa.
4. Todo contenedor oculto por JavaScript lleva su regla CSS
   `[hidden]{display:none}`.
5. Los hashes de la CSP se calculan sobre los bytes servidos (LF); los
   bloques inline se mantienen en una sola línea.
6. Las ediciones automatizadas de archivos se hacen con scripts `.mjs`, no
   con heredocs de shell (corrompen secuencias de escape).
7. En el DNS de Hostinger el TTL mínimo editable es 60; se usa 300.
8. Tras guardar una variable de entorno se confirma que el ámbito incluya
   «Production» antes de desplegar.
9. `git.deploymentEnabled` de `vercel.json` se evalúa con la configuración
   del commit entrante.
