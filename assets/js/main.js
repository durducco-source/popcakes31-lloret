/* PopCakes31 · interacciones (sin dependencias)
   1. Estado abierto/cerrado según el horario real (hora de Madrid)
   2. Menú móvil accesible
   3. Cabecera y enlace activo
   4. Asistente de encargo (email / Instagram)
   5. Mapa bajo demanda (privacidad)
   6. Barra de acciones en móvil */
(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ---------- 1. Horario ---------- */
  // Horario publicado en Google Business e Instagram: lunes a sábado 8–13 y 17–20; domingo cerrado.
  const SLOTS = [[8 * 60, 13 * 60], [17 * 60, 20 * 60]];
  const SCHEDULE = { 0: [], 1: SLOTS, 2: SLOTS, 3: SLOTS, 4: SLOTS, 5: SLOTS, 6: SLOTS };
  const DAY_NAMES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const WEEKDAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  function madridNow() {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Madrid",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date());
    const get = (type) => parts.find((p) => p.type === type).value;
    return { day: WEEKDAY_INDEX[get("weekday")], minutes: Number(get("hour")) * 60 + Number(get("minute")) };
  }

  const fmt = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;

  function openStatus() {
    const { day, minutes } = madridNow();
    const today = SCHEDULE[day];
    const current = today.find(([a, b]) => minutes >= a && minutes < b);
    if (current) return { open: true, text: `Abierto ahora · hasta las ${fmt(current[1])}`, day };

    const later = today.find(([a]) => a > minutes);
    if (later) return { open: false, text: `Cerrado ahora · abrimos a las ${fmt(later[0])}`, day };

    for (let i = 1; i <= 7; i++) {
      const d = (day + i) % 7;
      if (SCHEDULE[d].length) {
        const when = i === 1 ? "mañana" : `el ${DAY_NAMES[d]}`;
        return { open: false, text: `Cerrado · abrimos ${when} a las ${fmt(SCHEDULE[d][0][0])}`, day };
      }
    }
    return { open: false, text: "Cerrado", day };
  }

  function renderStatus() {
    const s = openStatus();
    $$("[data-open-status]").forEach((el) => {
      el.hidden = false;
      el.classList.toggle("is-open", s.open);
      const t = $("[data-open-text]", el);
      if (t) t.textContent = s.text;
    });
    $$(".hours tr[data-day]").forEach((row) => {
      const isToday = Number(row.dataset.day) === s.day;
      row.classList.toggle("is-today", isToday);
      const th = $("th", row);
      let tag = $(".sr-today", th);
      if (isToday && !tag) {
        tag = document.createElement("span");
        tag.className = "sr-today";
        tag.textContent = " (hoy)";
        tag.style.cssText = "position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap";
        th.appendChild(tag);
      } else if (!isToday && tag) {
        tag.remove();
      }
    });
  }
  renderStatus();
  setInterval(renderStatus, 60 * 1000);

  /* ---------- 2. Menú móvil ---------- */
  const header = $("[data-header]");
  const toggle = $("[data-menu-toggle]");
  const menu = $("[data-menu]");
  const mqMobile = window.matchMedia("(max-width: 959px)");

  function setMenu(open, { focus = true } = {}) {
    header.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    $(".nav-toggle__label", toggle).textContent = open ? "Cerrar" : "Menú";
    if (open && focus) {
      const first = $("a", menu);
      if (first) first.focus({ preventScroll: true });
    } else if (!open && focus) {
      toggle.focus({ preventScroll: true });
    }
  }

  if (toggle && menu) {
    toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
    menu.addEventListener("click", (e) => {
      if (e.target.closest("a") && mqMobile.matches) setMenu(false, { focus: false });
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && header.classList.contains("is-open")) setMenu(false);
      // Mantener el foco dentro del menú abierto
      if (e.key === "Tab" && header.classList.contains("is-open")) {
        const focusables = [toggle, ...$$("a, button", menu)];
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    mqMobile.addEventListener("change", (e) => { if (!e.matches) setMenu(false, { focus: false }); });
  }

  /* ---------- 3. Cabecera y enlace activo ---------- */
  const hero = $("#inicio");
  if (hero && "IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      header.classList.toggle("is-scrolled", entry.intersectionRatio < 0.98);
    }, { threshold: [0.98, 1] }).observe(hero);

    const links = new Map($$(".site-nav__link").map((a) => [a.getAttribute("href").slice(1), a]));
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const link = links.get(entry.target.id);
        if (!link) return;
        if (entry.isIntersecting) {
          links.forEach((l) => l.classList.remove("is-active"));
          link.classList.add("is-active");
        } else {
          link.classList.remove("is-active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    links.forEach((_, id) => { const s = document.getElementById(id); if (s) sectionObserver.observe(s); });
  }

  /* ---------- 4. Asistente de encargo ---------- */
  const form = $("[data-order-form]");
  if (form) {
    const preview = $("[data-preview]", form);
    const status = $("[data-form-status]", form);
    const dateInput = $("#f-fecha", form);
    const EMAIL = "popcakes31@gmail.com";
    const IG_DM = "https://ig.me/m/popcakes31";

    // No permitir fechas pasadas (hora local del visitante)
    const now = new Date();
    dateInput.min = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

    const dateLabel = (value) => {
      if (!value) return "";
      const [y, m, d] = value.split("-").map(Number);
      return new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
        .format(new Date(y, m - 1, d));
    };

    function values() {
      const data = new FormData(form);
      return {
        tipo: (data.get("tipo") || "").toString(),
        fecha: (data.get("fecha") || "").toString(),
        personas: (data.get("personas") || "").toString().trim(),
        idea: (data.get("idea") || "").toString().trim(),
        nombre: (data.get("nombre") || "").toString().trim(),
        telefono: (data.get("telefono") || "").toString().trim(),
      };
    }

    function buildMessage(v) {
      const lines = ["Hola, PopCakes31: me gustaría hacer un encargo."];
      const details = [];
      if (v.tipo) details.push(`• Qué necesito: ${v.tipo}`);
      if (v.fecha) details.push(`• Fecha: ${dateLabel(v.fecha)}`);
      if (v.personas) details.push(`• Personas: ${v.personas}`);
      if (v.idea) details.push(`• Idea: ${v.idea}`);
      if (details.length) lines.push("", ...details);
      if (v.nombre || v.telefono) {
        lines.push("");
        if (v.nombre) lines.push(`Me llamo ${v.nombre}.`);
        if (v.telefono) lines.push(`Mi teléfono: ${v.telefono}`);
      }
      lines.push("", "¡Gracias!");
      return lines.join("\n");
    }

    const update = () => {
      preview.textContent = buildMessage(values());
      // Si el aviso era un error y ya no queda ningún campo marcado, se limpia
      if (status.classList.contains("is-error") && !$$(".field__error:not([hidden])", form).length) say("");
    };
    form.addEventListener("input", update);
    form.addEventListener("change", update);
    update();

    function setError(name, show) {
      const err = $(`[data-error-for="${name}"]`, form);
      if (err) err.hidden = !show;
      if (name === "tipo") {
        $(".choices", form).setAttribute("aria-invalid", String(show));
        $$('input[name="tipo"]', form).forEach((r) => r.setAttribute("aria-invalid", String(show)));
      } else {
        const input = form.elements[name];
        if (input) input.setAttribute("aria-invalid", String(show));
      }
    }

    function validate() {
      const v = values();
      const missingTipo = !v.tipo;
      const missingNombre = !v.nombre;
      setError("tipo", missingTipo);
      setError("nombre", missingNombre);
      if (missingTipo) { $('input[name="tipo"]', form).focus(); }
      else if (missingNombre) { form.elements.nombre.focus(); }
      if (missingTipo || missingNombre) {
        say("Revisa los campos marcados para preparar el mensaje.", true);
        return null;
      }
      return v;
    }

    function say(text, isError = false) {
      status.textContent = text;
      status.classList.toggle("is-error", isError);
    }

    // Limpiar errores al corregir
    form.addEventListener("change", (e) => { if (e.target.name === "tipo") setError("tipo", false); });
    form.elements.nombre.addEventListener("input", () => setError("nombre", false));

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const v = validate();
      if (!v) return;
      const subject = `Encargo: ${v.tipo}${v.fecha ? " · " + dateLabel(v.fecha) : ""}`;
      const href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(buildMessage(v))}`;
      say("Abriendo tu app de correo con el mensaje preparado…");
      window.location.href = href;
    });

    async function copy(text) {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return;
      }
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;top:0;left:0;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      if (!ok) throw new Error("copy failed");
    }

    $("[data-copy-ig]", form).addEventListener("click", async () => {
      const v = validate();
      if (!v) return;
      try {
        await copy(buildMessage(v));
        say("Mensaje copiado. Pégalo en el chat de Instagram que se acaba de abrir.");
      } catch (err) {
        say("No se ha podido copiar automáticamente: selecciona el texto de «Tu mensaje» y cópialo.", true);
      }
      window.open(IG_DM, "_blank", "noopener");
    });

    // Enlaces que preseleccionan el tipo de encargo
    $$("[data-order]").forEach((link) => {
      link.addEventListener("click", () => {
        const radio = $$('input[name="tipo"]', form).find((r) => r.value === link.dataset.order);
        if (radio) { radio.checked = true; setError("tipo", false); update(); }
      });
    });
  }

  /* ---------- 5. Mapa bajo demanda ---------- */
  const map = $("[data-map]");
  if (map) {
    $("[data-map-load]", map).addEventListener("click", () => {
      const iframe = document.createElement("iframe");
      iframe.src = "https://maps.google.com/maps?q=PopCakes31%2C%20Carrer%20Comte%20Ramon%20Borrell%207%2C%2017310%20Lloret%20de%20Mar&z=17&output=embed";
      iframe.title = "Mapa de Google con la ubicación de PopCakes31";
      iframe.loading = "lazy";
      iframe.referrerPolicy = "no-referrer-when-downgrade";
      map.replaceChildren(iframe);
      map.classList.add("is-loaded");
      iframe.focus({ preventScroll: true });
    });
  }

  /* ---------- 6. Barra de acciones en móvil ---------- */
  const bar = $("[data-action-bar]");
  const heroCta = $("[data-hero-cta]");
  const order = $("#encargo");
  const footer = $(".site-footer");
  if (bar && heroCta && "IntersectionObserver" in window) {
    const seen = new Map();
    const sync = () => {
      const show = !seen.get(heroCta) && !seen.get(order) && !seen.get(footer);
      bar.classList.toggle("is-visible", show);
      bar.setAttribute("aria-hidden", String(!show));
      $$("a", bar).forEach((a) => (show ? a.removeAttribute("tabindex") : a.setAttribute("tabindex", "-1")));
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => seen.set(e.target, e.isIntersecting));
      sync();
    });
    [heroCta, order, footer].forEach((el) => el && io.observe(el));
  }
})();
