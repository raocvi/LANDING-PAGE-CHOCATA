# Estrategia de posicionamiento
## SEO clásico + AEO (aparecer en las respuestas de la IA)

Hoy la gente busca en dos mundos a la vez: escribe en Google y **le pregunta a
ChatGPT, Perplexity, Gemini o Claude**. Aparecer en el segundo no es lo mismo
que aparecer en el primero. Este documento separa lo que ya está hecho de lo
que falta, y ordena lo que falta por impacto real.

---

## 1. Cómo decide un asistente de IA a quién recomendar

No hay un «ranking» que escalar. El modelo necesita tres cosas:

1. **Permiso** para leer el sitio (su rastreador no bloqueado).
2. **Texto citable**: frases autocontenidas que respondan la pregunta completa
   sin necesitar el resto de la página.
3. **Confirmación desde afuera**: que la marca aparezca mencionada en sitios
   que él considera confiables (prensa, directorios, reseñas). Un asistente
   rara vez recomienda algo que solo existe en su propia web.

Los puntos 1 y 2 ya están resueltos. El 3 es trabajo de la marca, no del código.

## 2. Lo que ya quedó implementado

| Pieza | Qué hace | Dónde |
|---|---|---|
| **Permiso explícito a 16 rastreadores de IA** | GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended, Applebot-Extended y demás pueden leer y citar la tienda | `web/robots.txt` |
| **`llms.txt` en vivo** | Ficha del negocio en el formato que los asistentes prefieren. Se genera al vuelo con los precios y la visibilidad que la dueña tenga puestos en el Estudio | `api/llms.js` + `api/_llms.js` |
| **10 preguntas frecuentes visibles** | El texto que los asistentes citan. Respuestas autocontenidas que nombran marca, ciudad y dato concreto | Sección «Preguntas frecuentes» de la portada |
| **12 fichas `Product`** | Cada referencia con precio, presentaciones, disponibilidad, marca y país. Es lo que permite salir con precio en los resúmenes de Google | JSON-LD de `index.html` |
| **`Organization`** | Quién es CHOCATA: Cali, fundada por una mujer, respaldo del Fondo Emprender del SENA, contacto y temas que domina | JSON-LD |
| **`FAQPage` sincronizado** | Las mismas 10 preguntas en formato máquina, idénticas a las visibles | JSON-LD |
| **`speakable`** | Marca qué párrafos puede leer en voz alta un asistente | JSON-LD |
| **Fragmentos sin límite** | `max-snippet:-1` y `max-image-preview:large` autorizan a Google a usar textos largos e imágenes grandes en sus resúmenes de IA | `<meta name="robots">` |
| **Sitemap y Search Console** | El sitio ya está enviado, verificado y con indexación solicitada | `web/sitemap.xml` |

**Regla de mantenimiento:** si cambian precios o productos, regenerar la ficha
de IA con `node tools/generar-llms.mjs`. Si cambian las preguntas visibles, hay
que actualizar también el `FAQPage` del JSON-LD: deben decir lo mismo.

## 3. Lo que falta — ordenado por impacto

### 🥇 Prioridad máxima (esta semana)

**1. Perfil de Negocio de Google** — *~20 minutos, gratis*
Es la fuente que Google y Gemini consultan primero para negocios locales, y de
donde salen las respuestas a «¿dónde compro suplementos en Cali?».
- Ir a business.google.com → crear perfil **CHOCATA**
- Categoría: *Tienda de alimentos naturales* (secundaria: *Tienda de artículos deportivos*)
- Marcar **negocio con entrega a domicilio, sin dirección visible** (la sede está cerrada)
- Área de servicio: **Colombia**
- Cargar logo, fotos de producto y el enlace a www.chocata.com.co
- Escribir la descripción usando las mismas palabras del sitio

**2. Enlace en la biografía de Instagram** — *2 minutos*
@chocata_colombia debe enlazar **www.chocata.com.co**. Los asistentes cruzan
redes sociales con sitios web para confirmar que una marca es real.

**3. Pedir las primeras reseñas** — *empezar ya*
Escribir por WhatsApp a los clientes que ya compraron y pedirles reseña en el
Perfil de Negocio. Las reseñas son de lo más citado por los asistentes cuando
alguien pregunta «¿es confiable?». Cinco reseñas reales valen más que cincuenta
palabras clave.

### 🥈 Alto impacto (este mes)

**4. La historia en prensa** — *el mayor multiplicador disponible*
CHOCATA tiene una historia que los medios publican: **mujer emprendedora +
Fondo Emprender del SENA + terremoto que cerró la sede + la empresa sobrevive
vendiendo en línea**. Cada artículo publicado es una fuente externa confiable
que los asistentes citan durante años.
- Medios locales: *El País* (Cali), *Q'hubo*, *90 Minutos*, *El Occidente*
- Nacionales de emprendimiento: *Semana Empresas*, *Portafolio*, *La República*
- Institucionales: comunicaciones del **SENA** y del **Fondo Emprender**
  (suelen publicar casos de éxito de sus beneficiarios — pídelo, es gratis)
- Cámara de Comercio de Cali: directorio de afiliados y sus boletines

**5. Directorios y perfiles** — *una tarde*
Cada ficha consistente refuerza que la marca existe. Usar **siempre los mismos
datos**: nombre CHOCATA, Cali, +57 317 668 5235, www.chocata.com.co.
- Cámara de Comercio de Cali · Páginas Amarillas Colombia
- Marketplaces si se decide vender ahí (MercadoLibre, Rappi)
- Perfiles de marca: Facebook, TikTok, LinkedIn (aunque no se usen a diario)

**6. Google Merchant Center** — *~30 minutos, gratis*
Sube el catálogo a las fichas gratuitas de Google Shopping. Como los productos
ya están declarados con precio en el sitio, el trabajo es mínimo y abre otra
puerta de entrada.

### 🥉 Sostenido (cada mes)

**7. Responder preguntas reales, públicamente**
Los asistentes aprenden de donde la gente pregunta. Publicar respuestas útiles
—sin vender— en Reddit (r/Colombia, r/fitnesscol), grupos de Facebook de
ciclismo y gimnasio en Cali, y foros de nutrición, con mención natural de la
marca cuando venga al caso.

**8. Ampliar el contenido citable del sitio**
Cada duda nueva que llegue por WhatsApp es una pregunta que otros también
tienen: agregarla a las preguntas frecuentes. Es la forma más barata de crecer
en superficie de respuesta.

**9. Mantener la coherencia de datos**
Que el teléfono, el correo y la ciudad sean idénticos en todos lados. Una
inconsistencia hace dudar a los sistemas automáticos.

## 4. Cómo medir si está funcionando

| Qué | Dónde | Cada cuánto |
|---|---|---|
| Búsquedas por las que aparece, clics y posición | Search Console → Rendimiento | Semanal |
| Páginas indexadas | Search Console → Páginas | Mensual |
| Visitas y de dónde llegan | Vercel Analytics | Semanal |
| **Prueba de asistentes** | Preguntar en ChatGPT, Perplexity y Gemini: *«¿dónde puedo comprar chocolate saludable o suplementos en Cali?»*, *«¿qué es CHOCATA Colombia?»* | Mensual |

La prueba de asistentes es la más honesta: si la marca aparece con datos
correctos, el AEO está funcionando; si no aparece, falta presencia externa
(punto 3 de la sección 1), no más código.

## 5. Expectativa realista de tiempos

- **Días**: la portada aparece al buscar «chocata» o «chocata.com.co».
- **2 a 6 semanas**: empieza a competir en búsquedas como «chocolate saludable
  Cali» o «creatina Cali», y el Perfil de Negocio surte efecto en Maps.
- **2 a 4 meses**: los asistentes de IA empiezan a mencionar la marca, siempre
  que existan menciones externas. Sin prensa ni reseñas, este paso no llega
  por más técnica que se aplique.

Ningún proveedor serio promete el primer lugar en semanas. Lo que sí está
garantizado es que, cuando alguien pregunte por la marca, la información que
encuentre sea correcta, completa y favorable.
