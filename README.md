# CHOCATA Colombia — www.chocata.com.co

Tienda en línea y página de marca de CHOCATA S.A.S. (Cali, Colombia):
nutrición con sabor — bebidas de malta y cacao, proteína, creatina,
colágeno, magnesio, vitamina C y más. Emprendimiento caleño fundado por una
mujer, con respaldo del Fondo Emprender del SENA.

**Toda la documentación empieza en la wiki: [docs/wiki/index.md](docs/wiki/index.md)**

| Atajo | |
|---|---|
| Diseño del sistema (SDD) | [docs/SDD.md](docs/SDD.md) |
| Runbook de operación | [docs/OPERACION.md](docs/OPERACION.md) |
| Especificación «Estudio» | [docs/PROMPT-MAESTRO-ESTUDIO.md](docs/PROMPT-MAESTRO-ESTUDIO.md) |

## Arranque rápido (desarrollo)

```bash
node tools/servidor-local.mjs   # tienda completa en http://localhost:5174
node tools/sembrar-demo.mjs     # datos de demostración
node tools/probar-flujo.mjs     # suite E2E
```

Stack: HTML/CSS/JS puro · Vercel Functions · Vercel Blob · Wompi · Brevo ·
Gemini (Sofi) · dominio en Hostinger. Costo fijo: $0 + dominio anual.
