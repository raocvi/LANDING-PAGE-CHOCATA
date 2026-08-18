# Wiki de CHOCATA — empieza aquí

Bienvenida/o al proyecto de **www.chocata.com.co**: tienda en línea y página
de marca de CHOCATA S.A.S. (Cali, Colombia). Esta wiki es el índice de toda
la documentación.

## Si eres nuevo en el proyecto: ruta de 30 minutos

1. **[SDD.md](../SDD.md)** — qué es el sistema, con qué está construido, sus
   principios y sus flujos críticos (15 min)
2. **[OPERACION.md](../OPERACION.md)** — dónde vive cada cuenta y cada llave,
   cómo se despliega, diagnóstico rápido y reglas fijas (10 min)
3. Levanta el entorno local (5 min):
   ```bash
   node tools/servidor-local.mjs   # web + api en http://localhost:5174
   node tools/sembrar-demo.mjs     # pedidos de demostración
   node tools/probar-flujo.mjs     # la suite E2E debe quedar en verde
   ```

## Mapa de documentos

| Documento | Qué contiene |
|---|---|
| [SDD.md](../SDD.md) | Diseño de software: stack, arquitectura, mapa del repo, flujos del dinero, seguridad, SEO, hoja de ruta |
| [OPERACION.md](../OPERACION.md) | Runbook: cuentas, variables de entorno, DNS, despliegue, mantenimiento, migraciones, diagnóstico |
| [MANUAL-ESTUDIO.md](../MANUAL-ESTUDIO.md) | **Para la dueña**: cómo editar textos, precios, productos e imágenes desde `/estudio` |
| [REPLICAR-MODELO.md](../REPLICAR-MODELO.md) | **Para el desarrollador**: cómo levantar otra tienda como esta desde Claude Code, con las trampas ya pagadas |
| [PROMPT-MAESTRO-ESTUDIO.md](../PROMPT-MAESTRO-ESTUDIO.md) | La especificación del «Estudio» que guio su construcción |
| [../web/README.md](../../web/README.md) | Notas del frontend |
| Grafo de conocimiento | `graphify-out/` — consultas: `graphify query "..."`, `graphify explain "..."` |

## Las cinco preguntas más frecuentes

**¿Dónde están las llaves/secretos?**
Todas en Vercel → proyecto `chocata` → Settings → Environment Variables.
Ningún secreto vive en el repo. Detalle por variable en
[OPERACION.md §2](../OPERACION.md).

**¿Cómo se publica un cambio?**
Rama `feat/...` → merge a `main` → push (despliegue automático). Subir la
versión `?v=NN` de los assets en los 5 HTML si se tocó CSS/JS.
Detalles y límites en [OPERACION.md §4](../OPERACION.md).

**¿Cómo pruebo sin gastar plata?**
`tools/servidor-local.mjs` ejecuta la tienda completa con llaves de mentira
y pedidos en `.pedidos/`. La suite `tools/probar-flujo.mjs` recorre
compra → webhook → despacho.

**¿Quién calcula los precios?**
Siempre el servidor (`api/_pedido.js`) desde `web/assets/data/*.json`.
El navegador solo manda slugs y cantidades.

**¿Qué es /pedidos, /tablero y /estudio?**
Las tres páginas de administración (clave `ADMIN_TOKEN`): central de despachos
con módulo logístico, tablero analítico, y el Estudio donde la dueña edita el
contenido. Todas `noindex` + `no-store` y fuera de `robots.txt`.

**¿Cómo se edita el contenido sin desplegar?**
Desde `/estudio`. Los textos, precios, orden, visibilidad e imágenes viven en
el Blob (o `.contenido/` en desarrollo) y la página los lee al cargar; si eso
falla, se muestra el contenido de fábrica del HTML. Ver
[SDD §5.4](../SDD.md) y el [manual de la dueña](../MANUAL-ESTUDIO.md).

## Convenciones del proyecto

- Todo en español: código, comentarios, UI, documentación y commits.
- Sin frameworks ni build: lo que está en `web/` es lo que se sirve.
- Estética: lujo oscuro dorado; dinero en Jost con números tabulares;
  píldoras de estado con color+texto; táctiles ≥44 px.
- Las reglas fijas de operación están en [OPERACION.md §9](../OPERACION.md)
  — se cumplen siempre.
