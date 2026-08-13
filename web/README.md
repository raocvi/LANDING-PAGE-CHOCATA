# CHOCATA Colombia — Landing page

Landing de una sola página para CHOCATA S.A.S. (@chocata_colombia).
HTML + CSS + JavaScript sin build step. Animación con GSAP + ScrollTrigger y scroll suave con Lenis (los tres desde CDN).

## Cómo verla

Abrir con un servidor local (las rutas de imágenes son relativas):

```bash
python -m http.server 5173 --directory web
```

Luego entrar a `http://localhost:5173`.

## Estructura

```
web/
  index.html                 Marcado completo (contenido y fichas visibles sin JS)
  assets/css/style.css       Sistema de diseño y toda la maquetación
  assets/js/products.js      Fichas de producto: descripción, beneficios, uso y fuentes
  assets/js/main.js          Preloader, nav, animaciones, filtros, modal, acordeón
  assets/img/brand/*         Logotipo oficial (webp, png y favicon), desde LOGO2.png
  assets/img/packs/*.webp    Empaques con canal alfa — sin uso hoy, se dejan disponibles
  assets/img/life/*.webp     Composiciones: hero, tarjetas, rituales y fichas de producto
```

Los `.webp` se generaron a partir de los PNG originales de `productos_sin_fondo/` y
`composiciones/`. Peso total de imágenes: ~5 MB (los PNG originales sumaban ~120 MB).

**Los PNG de `productos_sin_fondo/` ya traen canal alfa** (salvo `PROTEINA.png`), así que se
convierten conservando la transparencia. Aplanarlos a RGB los deja sobre un rectángulo negro.
`LOGO2.png` también trae alfa y se usa tal cual, solo recortado al contenido visible.
El único archivo que requiere recorte de fondo es `PROTEINA.png`: relleno por inundación desde
el perímetro y conservando la mancha conectada más grande.

## Secciones

1. **Hero** — composición con parallax encuadrada para que se vea el empaque de la propia foto,
   titular a la derecha con reveal palabra a palabra y una banda de beneficios en movimiento
   (cada pastilla abre la ficha del producto; se detiene al pasar el cursor o al recibir foco).
2. **Sellos** — materia prima pura, etiquetado frontal, trazabilidad, hecho en Colombia.
3. **Origen** — la historia real de la marca: una emprendedora caleña que creó la primera fórmula
   buscando una bebida con la carga nutricional que necesitaba su hija, con el respaldo del Fondo
   Emprender del SENA. Foto difuminada por máscara radial y parallax dentro de su marco.
4. **Catálogo** — 12 referencias con filtro por categoría; cada tarjeta abre una ficha completa.
5. **Rituales** — carrusel horizontal fijado con ScrollTrigger (scroll nativo con snap en móvil).
6. **Ciencia** — acordeón con la evidencia por ingrediente; cada panel abierto va en su propio
   marco con tinte cacao y un haz de luz recorriendo el borde superior. Al lado, el recomendador
   **«¿Qué estás buscando?»**: seis objetivos que devuelven las referencias que los trabajan, con
   la dosis o el mecanismo concreto, y cada resultado abre su ficha.
7. **Nutrición** — tabla nutricional declarada y contadores animados.
8. **Food service** — formato granel de 3,5 kg para canal institucional.
9. **Instagram** — galería que enlaza a @chocata_colombia.
10. **CTA final + footer** — el key visual con toda la línea (`life/principal.webp`, desde
    `composiciones/PRINCIPAL.png`) cierra la página, fundido por arriba y por abajo. En móvil se
    muestra a 320 px de alto y se recorre en horizontal, porque a 375 px de ancho completo queda
    en 160 px y no se distingue ningún producto. Después, WhatsApp, Instagram y aviso legal.

## Decisiones técnicas

- **Progressive enhancement.** Si GSAP no carga o el usuario tiene `prefers-reduced-motion: reduce`,
  se retira la clase `motion` del `<html>` y todo el contenido queda visible y navegable.
  El carrusel de rituales cae a scroll horizontal nativo con scroll-snap.
- **Solo composiciones, y todas se funden con el fondo.** Tarjetas, rituales, manifiesto y fichas
  usan la foto compuesta del producto a sangre, con `mask-image` que disuelve los bordes en la
  superficie que hay debajo. Cada producto tiene dos tomas distintas: una en la tarjeta y otra en
  la ficha, para que abrir el detalle aporte algo nuevo.
- **La ficha es una foto a pantalla completa.** La composición ocupa todo el panel (`height: 92svh`,
  `object-fit: cover`) y es `sticky`, así que se mantiene mientras se lee. Se disuelve de izquierda
  a derecha con `mask-image` y el texto se monta encima a partir del 51 % del ancho, con un velo
  (`.modal__content::before`) que garantiza el contraste. Sin una altura definida en la columna, el
  `height: 100%` de la imagen no resuelve y la foto se estira con el texto.
- **El botón de cerrar no puede ir con `float`.** La retícula del modal crea un contexto de formato
  de bloque y esquiva los flotantes, así que el botón le robaba 60 px de ancho a la imagen. Va en
  una barra `sticky` de altura cero.
- **Versionado de assets.** CSS y JS se enlazan con `?v=N`. Al editarlos hay que subir el número o
  el navegador sirve la versión anterior.
- **Sin CLS.** Todos los `<img>` llevan `width`/`height` reales y `height: auto` en CSS para que el
  atributo no fije la altura en píxeles.
- **Accesibilidad.** Skip link, foco visible, `aria-expanded` en nav y acordeón, `aria-pressed` en
  filtros, modal con `role="dialog"`, cierre con Escape, trampa de foco y devolución del foco al
  disparador. Todos los objetivos táctiles miden 44 px o más.

## Medición

Toda la analítica sale por una sola función, `medir()` en `main.js`. Reconoce Vercel
(`window.va`), Umami y Google Analytics si están cargados, y no hace nada si no hay ninguno.
Cambiar de proveedor es tocar ese único punto.

> Cuidado con el nombre: el carrusel de rituales ya usa `var track` para su elemento del DOM.
> Una función `track()` en el mismo ámbito queda sobrescrita por esa variable. Por eso se
> llama `medir()`.

**Eventos que emite:**

| Evento | Datos | Para qué |
|---|---|---|
| `Ficha de producto` | producto, origen | Ranking de productos y qué zona los abre |
| `WhatsApp` | origen | La conversión real: cuántos escriben y desde dónde |
| `Instagram` | origen | Tráfico hacia la red |
| `Filtro de catalogo` | categoria | Qué línea buscan |
| `Recomendador` | objetivo | Qué necesidad declara la gente |
| `Ciencia` | ingrediente | Si el contenido de evidencia se lee |
| `Fuente cientifica` | origen | Si alguien verifica las fuentes |
| `Profundidad de lectura` | porcentaje | Hasta dónde llegan en una página larga |

**Proveedores.** Vercel Web Analytics ya está enlazado en `index.html` y hay que activarlo una
vez en el panel; da visitas, dispositivo, país, navegador y origen del tráfico, pero sus eventos
personalizados exigen plan Pro. Para el ranking de productos en plan gratuito, el `index.html`
trae la línea de Umami comentada: basta pegar el `website-id` y descomentarla.

Ambos son sin cookies y no recogen datos personales, así que el sitio no necesita banner de
consentimiento. Eso cambiaría si se pasa a Google Analytics.

## Cómo se redactan los beneficios

Cada beneficio habla a dos lectores a la vez: quien entrena y quien solo quiere estar mejor.
La regla es decir **qué hace, cuánto y para quién**, con la cifra del estudio cuando existe
(«−17 minutos para conciliar el sueño», «15 % menos severidad del resfriado», «−4,4 mmHg»),
y traducirla a algo cotidiano: subir escaleras, cargar mercado, llegar a media mañana sin bajón.

Sin comentario editorial: nada de «dicho con honestidad», «conviene ser honestos» ni salvedades
sobre la calidad de los estudios. El texto afirma lo que la fuente respalda y se detiene ahí; si
un hallazgo solo aplica a un grupo o a un contexto, se acota la frase en positivo («cuando se ha
dormido poco», «en quienes ya toman medicación») en lugar de añadir un pero.

## Contenido científico

Las afirmaciones de beneficio están redactadas sobre el ingrediente, no sobre el producto, y cada
ficha enlaza a la fuente primaria: posiciones oficiales de la ISSN y el ACSM, fichas técnicas de la
NIH Office of Dietary Supplements, y revisiones sistemáticas con metaanálisis indexadas en PubMed/PMC.
El pie de página incluye el aviso de que son alimentos y materias primas alimentarias, no medicamentos.

## Pendientes para producción

- El logotipo viene de `LOGO2.png` (1536×1024). Si existe el vectorial original (AI/SVG/EPS),
  reemplazarlo: rinde mejor en pantallas de alta densidad y pesa menos.
- **Faltan dos precios.** El colágeno hidrolizado no tiene pieza gráfica y la de remolacha no
  declara precio: esa ficha muestra «Consultar». La pieza de Hidratec tampoco declara el peso neto.
- La pieza de CHOCATA Premium trae otro WhatsApp (320 761 9086); el sitio usa 317 668 5235 en todo.
- Confirmar disponibilidad y el enlace de compra/catálogo si se abre canal de e-commerce.
- El WhatsApp de contacto es +57 317 668 5235 (confirmado por el cliente). Algunos empaques traen
  impreso 317 680 5255; conviene unificarlo en la próxima tirada.
- Añadir favicon, imagen `og:image` y `sitemap.xml` al publicar en dominio propio.
