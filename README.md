# LANDING-PAGE-CHOCATA

Landing page de CHOCATA S.A.S. — marca caleña de bebidas de malta y cacao y línea de
nutrición funcional, creada por una emprendedora con el respaldo del Fondo Emprender del SENA.

## Cómo verla

```bash
python -m http.server 5173 --directory web
```

Luego abrir `http://localhost:5173`.

## Estructura

| Ruta | Qué es |
|---|---|
| `web/` | El sitio completo: HTML, CSS, JS e imágenes optimizadas |
| `web/README.md` | Documentación técnica: secciones, decisiones de diseño y pendientes |
| `LOGO2.png` | Logotipo oficial con canal alfa (fuente del logo del sitio) |

HTML, CSS y JavaScript sin build step. Animación con GSAP + ScrollTrigger y scroll suave con
Lenis, los tres desde CDN.

## Material fuente

Los PNG originales de `composiciones/` y `productos_sin_fondo/` (~80 MB) están excluidos por
`.gitignore`: el sitio solo consume los `.webp` ya optimizados de `web/assets/img/`, que pesan
~5 MB en total. Para versionarlos también, comenta esas dos líneas del `.gitignore`.

## Detalle técnico

Ver [web/README.md](web/README.md).
