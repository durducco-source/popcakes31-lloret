# PopCakes31 · web

Web de una sola página para **PopCakes31 — Repostería creativa & coffee** (Lloret de Mar).
HTML + CSS + JavaScript sin dependencias ni paso de compilación: se puede publicar tal cual
en GitHub Pages, Netlify o cualquier hosting estático.

**Publicada en:** https://durducco-source.github.io/popcakes31-lloret/ (GitHub Pages, rama `main`).

## Cómo verla

```powershell
npm run dev      # servidor local en http://localhost:4173 (Node 18+, sin instalar nada)
npm run check    # comprobaciones estáticas + sintaxis de main.js
```

`index.html` también se puede abrir directamente con doble clic (el script no usa módulos).

## Estructura

```
index.html                 Página completa (semántica, JSON-LD LocalBusiness, Open Graph)
assets/css/styles.css      Sistema visual: tokens, retícula, componentes y responsive
assets/js/main.js          Horario en vivo, menú móvil, asistente de encargo, mapa bajo demanda, barra móvil
assets/img/                Fotos optimizadas + favicon.svg + og-popcakes31.jpg
tools/serve.mjs            Servidor estático mínimo
tools/check.mjs            Comprobaciones de calidad (enlaces, alt, ids, etiquetas, encabezados…)
```

## Datos usados y su fuente (consultados el 19/11/2026)

| Dato | Fuente |
|---|---|
| Dirección: Carrer Comte Ramon Borrell, 7-9, Local 5, 17310 Lloret de Mar | Ficha de Google Business |
| Teléfono 698 29 18 93 | Google Business y Facebook |
| Email popcakes31@gmail.com | Página de Facebook (/popcakes31) |
| Horario: lunes a sábado 8:00–13:00 y 17:00–20:00; domingo cerrado | Google Maps (día a día) e Instagram (bio) |
| «Pastelería especializada en repostería creativa. Servicio de cafetería y take away.» | Descripción del propietario en Google |
| «Repostería creativa & coffee» | Bio de Instagram |
| «Tartas y pastelitos por encargo» | Facebook |
| Candy bar / mesas dulces, catering, bodas, bautizos (#bateig) | Publicaciones de Instagram |
| 4,8 / 5 con 168 opiniones; temas «ambiente», «pastelería», «merendar» | Google Maps (la web indica la fecha) |
| Cita «Lugar ideal para desayunar con un buen café y un trozo de pastel» | Resumen de opiniones de Google Maps |
| Carta (cafés, tés e infusiones, tostadas, bebidas, leche vegetal o sin lactosa con suplemento) | Foto de la carta publicada en Google Maps por un cliente (sept. 2025). **Sin precios** |
| Perfiles: instagram.com/popcakes31 · facebook.com/popcakes31 · tiktok.com/@popcakes31 | Enlaces de la ficha de Google |

No se han inventado precios, plazos de encargo, zonas de servicio, premios ni reseñas.

## Fotos

| Archivo | Origen |
|---|---|
| tarta-drip-frutos-rojos-720/1280.jpg, og-popcakes31.jpg | Foto del propietario en Google Maps (ene. 2022), 1600 px |
| local-barra-ventana-700/1200.jpg | Foto del propietario en Google Maps (ene. 2022), 1600 px |
| Resto (11 archivos) | Portadas de publicaciones de @popcakes31 (360×640 sin sesión iniciada) |

Las portadas de Instagram se muestran pequeñas (≤ 300 px de ancho) para no perder nitidez,
pero en pantallas retina se ven algo suaves: conviene sustituirlas por los originales.
Cada foto de Instagram enlaza a su publicación.

## Decisiones de diseño

- **Paleta**: nata `#FAF5EE` (fondo), cacao-ciruela `#2A1F26` (texto), lila del logotipo `#B49BD3`
  (solo decorativo), mora `#533A7B` (acción) y la pared rosada del local `#F4E8E0` como superficie.
  Todos los pares de texto superan WCAG AA (5,2:1 a 14,6:1).
- **Tipografía**: Fraunces con el eje «SOFT» al máximo (serifas redondeadas, como crema pastelera)
  para titulares y Figtree, geométrica y legible, como eco del logotipo redondo.
- **Retícula**: 12 columnas, 1200 px, márgenes 16–40 px; composición simétrica en opiniones y en
  «Visítanos» (horario y contacto como listas regladas enfrentadas).
- **Momento de la página**: en «Eventos», cinco fotos que al hacer scroll se escalonan como los pisos
  de una mesa dulce (CSS scroll-driven; sin soporte o con movimiento reducido queda quieto y escalonado).
- **Movimiento**: entrada única del hero, subrayados que se dibujan, botones que ceden al pulsar,
  zoom 1,03 en fotos enlazadas. Hover solo con ratón; `prefers-reduced-motion` lo detiene todo.
- **Encargos sin servidor**: el asistente prepara el mensaje y lo abre en el correo (`mailto:`) o lo
  copia y abre el chat de Instagram. No guarda datos. Sin JavaScript, el formulario usa `mailto:` nativo.
- **Privacidad**: el mapa de Google solo se carga si el visitante lo pide.

## Pendiente (necesita al negocio)

1. **Logotipo oficial en SVG**: la cabecera usa un wordmark tipográfico y un favicon provisionales.
2. **Fotos originales en alta resolución** (sobre todo de Instagram) y confirmar que se pueden usar
   las que muestran nombres de clientes en la tarta («Jonathan», «Ginevra 8»).
3. **Confirmar la carta** (la fuente es de sept. 2025) y si quieren publicar precios.
4. **Textos legales** (aviso legal, privacidad, cookies – LSSI/RGPD): requieren razón social y NIF.
5. **Dominio propio**: ahora `canonical`, `og:url` y `og:image` apuntan a GitHub Pages; si se usa un
   dominio propio hay que cambiarlos y añadir `sitemap.xml` y `robots.txt`.
6. **Fuentes autoalojadas** en lugar de Google Fonts (recomendable por RGPD).
7. ¿WhatsApp para encargos? Solo se ha enlazado teléfono, email e Instagram porque son los verificados.
8. Versión en catalán o inglés (Lloret de Mar recibe mucho turismo).
9. Actualizar periódicamente la nota de Google (4,8 / 168 a 19/11/2026).
