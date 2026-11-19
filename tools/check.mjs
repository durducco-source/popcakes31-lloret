// Comprobaciones estáticas de calidad (sin dependencias).
// Uso: node tools/check.mjs   → sale con código 1 si algo falla.
import { readFileSync, existsSync, statSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "index.html"), "utf8");
const css = readFileSync(join(root, "assets/css/styles.css"), "utf8");
const js = readFileSync(join(root, "assets/js/main.js"), "utf8");

const fails = [];
const warns = [];
let passes = 0;
const check = (ok, msg, level = "fail") => {
  if (ok) passes++;
  else (level === "warn" ? warns : fails).push(msg);
};

// Quitar comentarios y JSON-LD para los análisis de marcado
const markup = html.replace(/<!--[\s\S]*?-->/g, "").replace(/<script[\s\S]*?<\/script>/g, "");
const tags = (name) => [...markup.matchAll(new RegExp(`<${name}\\b[^>]*>`, "gi"))].map((m) => m[0]);
const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*"([^"]*)"`, "i"));
  return m ? m[1] : null;
};

// 1. Documento
check(/<html lang="es"/.test(html), "Falta lang=\"es\" en <html>");
check(/<meta name="viewport"/.test(html), "Falta meta viewport");
check(/<title>[^<]{10,70}<\/title>/.test(html), "El <title> falta o no mide 10–70 caracteres");
const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "";
check(desc.length >= 70 && desc.length <= 170, `Meta description de ${desc.length} caracteres (recomendado 70–170)`, "warn");
check(/property="og:image"/.test(html), "Falta og:image");

// 2. JSON-LD válido
const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
try { JSON.parse(ld[1]); passes++; } catch (e) { fails.push("JSON-LD no es JSON válido: " + e.message); }

// 3. IDs únicos y anclas internas
const ids = [...markup.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
check(dupes.length === 0, "IDs duplicados: " + [...new Set(dupes)].join(", "));
for (const a of tags("a")) {
  const href = attr(a, "href");
  if (!href) { fails.push("Enlace sin href: " + a); continue; }
  if (href.startsWith("#")) check(href === "#" ? false : ids.includes(href.slice(1)), `Ancla rota: ${href}`);
  if (/target="_blank"/.test(a)) check(/rel="[^"]*noopener/.test(a), `Enlace externo sin rel="noopener": ${href}`);
  if (href.startsWith("tel:")) check(/^tel:\+34\d{9}$/.test(href), `Teléfono con formato inesperado: ${href}`);
  if (href.startsWith("mailto:")) check(href === "mailto:popcakes31@gmail.com", `Email inesperado: ${href}`);
}
for (const ref of [...markup.matchAll(/aria-(?:controls|describedby|labelledby)="([^"]+)"/g)]) {
  for (const id of ref[1].split(/\s+/)) check(ids.includes(id), `aria-* apunta a un id inexistente: ${id}`);
}

// 4. Imágenes: alt, dimensiones y archivos
for (const img of tags("img")) {
  const src = attr(img, "src");
  check(attr(img, "alt") !== null && attr(img, "alt").length > 10, `Imagen sin alt descriptivo: ${src}`);
  check(attr(img, "width") && attr(img, "height"), `Imagen sin width/height (CLS): ${src}`);
  check(existsSync(join(root, src)), `No existe el archivo: ${src}`);
  const srcset = attr(img, "srcset");
  if (srcset) for (const part of srcset.split(",")) {
    const file = part.trim().split(/\s+/)[0];
    check(existsSync(join(root, file)), `No existe el archivo del srcset: ${file}`);
  }
  if (!/fetchpriority="high"/.test(img)) check(/loading="lazy"/.test(img), `Imagen bajo el pliegue sin loading="lazy": ${src}`, "warn");
  const bytes = existsSync(join(root, src)) ? statSync(join(root, src)).size : 0;
  check(bytes < 350 * 1024, `Imagen pesada (${Math.round(bytes / 1024)} KB): ${src}`, "warn");
}
for (const href of [...markup.matchAll(/(?:href|src)="((?:assets)\/[^"]+)"/g)].map((m) => m[1])) {
  check(existsSync(join(root, href)), `Recurso local inexistente: ${href}`);
}

// 5. Encabezados: un h1 y sin saltos de nivel
const heads = [...markup.matchAll(/<h([1-6])\b/g)].map((m) => Number(m[1]));
check(heads.filter((h) => h === 1).length === 1, "Debe haber exactamente un <h1>");
heads.forEach((h, i) => { if (i > 0) check(h - heads[i - 1] <= 1, `Salto de encabezado h${heads[i - 1]} → h${h}`); });

// 6. Formularios: cada control con etiqueta
for (const input of [...tags("input"), ...tags("textarea"), ...tags("select")]) {
  const type = attr(input, "type");
  if (type === "radio" || type === "checkbox" || type === "hidden") continue;
  const id = attr(input, "id");
  check(id && new RegExp(`<label[^>]*for="${id}"`).test(markup), `Control sin <label for>: ${input}`);
}
check(/<fieldset[\s\S]*?<legend/.test(markup), "El grupo de opciones necesita fieldset + legend");
for (const btn of tags("button")) check(/type="(button|submit)"/.test(btn), `Botón sin type explícito: ${btn}`);

// 7. Contenido: sin restos de plantilla ni datos inventados típicos
check(!/lorem ipsum|TODO|FIXME|example\.com|xxx/i.test(markup), "Quedan textos de relleno o marcadores");
check(!/€\s?\d|\d\s?€/.test(markup.replace(/1–10 €/g, "")), "Aparece un precio: confirmar con el negocio antes de publicarlo");

// 8. CSS: recursos y motion
for (const m of css.matchAll(/url\(["']?(?!data:|https?:)([^"')]+)/g)) {
  check(existsSync(resolve(join(root, "assets/css"), m[1])), `url() rota en CSS: ${m[1]}`);
}
check(/prefers-reduced-motion:\s*reduce/.test(css), "Falta la variante prefers-reduced-motion");
check(!/transition:\s*all/.test(css), "Evitar transition: all");
check(/:focus-visible/.test(css), "Falta estilo de foco visible");

// 9. JS: sin dependencias externas ni console.log olvidados
check(!/import\s|require\(/.test(js), "main.js no debería importar dependencias");
check(!/console\.log/.test(js), "Quedan console.log en main.js", "warn");

console.log(`\nComprobaciones superadas: ${passes}`);
if (warns.length) console.log(`\nAvisos (${warns.length}):\n - ` + warns.join("\n - "));
if (fails.length) {
  console.log(`\nErrores (${fails.length}):\n - ` + fails.join("\n - "));
  process.exit(1);
}
console.log("\nOK: sin errores.\n");
