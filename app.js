/* === iphone41f6.js === */
(() => {
  const ua = navigator.userAgent || "";
  const isIphone = /iPhone|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1 && Math.min(screen.width, screen.height) <= 820);
  if (!isIphone) return;
  document.documentElement.classList.add("is-iphone");
  document.body.classList.add("is-iphone");
  const setHeight = () => {
    const h = window.visualViewport?.height || window.innerHeight;
    document.documentElement.style.setProperty("--app-height", h + "px");
  };
  setHeight();
  window.addEventListener("resize", setHeight, { passive: true });
  window.addEventListener("orientationchange", () => setTimeout(setHeight, 120), { passive: true });
  window.visualViewport?.addEventListener("resize", setHeight, { passive: true });
  document.addEventListener("gesturestart", event => event.preventDefault(), { passive: false });
})();
;
/* === android41f6.js === */
(() => {
  if (!/Android/i.test(navigator.userAgent || "")) return;
  document.documentElement.classList.add("is-android");
  document.body.classList.add("is-android");
  const setHeight = () => {
    const h = window.visualViewport?.height || window.innerHeight;
    document.documentElement.style.setProperty("--app-height", h + "px");
  };
  setHeight();
  window.addEventListener("resize", setHeight, { passive: true });
  window.visualViewport?.addEventListener("resize", setHeight, { passive: true });
})();
;
/* === pc41f6.js === */
(() => {
  let shell;
  let stage;
  let resizeObserver;

  function getViewportSize() {
    const vv = window.visualViewport;
    return {
      width: Math.max(320, vv ? vv.width : window.innerWidth),
      height: Math.max(568, vv ? vv.height : window.innerHeight)
    };
  }

  function isDesktopPhonePreview(width, height) {
    return width >= 768 && width > height;
  }

  function updatePreviewVars() {
    const { width, height } = getViewportSize();
    const desktopPreview = isDesktopPhonePreview(width, height);
    const root = document.documentElement;
    const isPc = !/android|iphone|ipad|ipod/i.test(navigator.userAgent || "");
    root.classList.toggle("is-pc", isPc);
    document.body.classList.toggle("is-pc", isPc);

    let previewWidth = width;
    let previewHeight = height;
    let previewScale = 1;

    if (desktopPreview) {
      const chromeMargin = 36;
      previewWidth = Math.min(430, ((height - chromeMargin) * 9) / 16, width - chromeMargin);
      previewHeight = Math.min(height - chromeMargin, (previewWidth * 16) / 9);
      previewScale = previewWidth / width;
    }

    root.style.setProperty("--preview-width", `${previewWidth}px`);
    root.style.setProperty("--preview-height", `${previewHeight}px`);
    root.style.setProperty("--preview-scale", String(previewScale));
    document.body.classList.toggle("desktop-phone-preview", desktopPreview);
  }

  function updateShellHeight() {
    if (!shell || !stage) return;
    if (!document.body.classList.contains("desktop-phone-preview")) {
      shell.style.height = "auto";
      return;
    }
    const scale = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--preview-scale")) || 1;
    const scaledHeight = Math.ceil(stage.scrollHeight * scale);
    const minHeight = Math.ceil(parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--preview-height")) || window.innerHeight || 568);
    shell.style.height = `${Math.max(scaledHeight, minHeight)}px`;
  }

  function refreshPreview() {
    updatePreviewVars();
    updateShellHeight();
  }

  function initPreview() {
    shell = document.querySelector(".phone-preview-shell");
    stage = document.querySelector(".phone-preview-stage");
    refreshPreview();
    if ("ResizeObserver" in window && stage) {
      resizeObserver = new ResizeObserver(() => updateShellHeight());
      resizeObserver.observe(stage);
    }
    setTimeout(updateShellHeight, 120);
    setTimeout(updateShellHeight, 800);
  }

  window.addEventListener("DOMContentLoaded", initPreview, { once: true });
  window.addEventListener("load", refreshPreview);
  window.addEventListener("resize", refreshPreview);
  window.addEventListener("orientationchange", () => {
    setTimeout(refreshPreview, 80);
    setTimeout(refreshPreview, 420);
  });
  window.addEventListener("invitacionAbierta", refreshPreview);
  window.addEventListener("sobreAbierto", refreshPreview);

  if ("MutationObserver" in window) {
    const observer = new MutationObserver(() => refreshPreview());
    window.addEventListener("DOMContentLoaded", () => {
      const main = document.getElementById("contenido-principal") || document.getElementById("invitation");
      if (main) observer.observe(main, { attributes: true, childList: true, subtree: true, attributeFilter: ["hidden", "class", "style"] });
      if (document.body) observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    }, { once: true });
  }

  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", refreshPreview);
    window.visualViewport.addEventListener("scroll", refreshPreview);
  }
})();
;
/* === reloj-base41f6.js === */
/* =========================================================
   MARK: RELOJ BASE
   Seccion reutilizable para fecha, cuenta regresiva y calendario.
   Recibe config desde main.js?cache=88; no hace fetch ni depende de demos.
   ========================================================= */

(() => {
  "use strict";

  const ns = window.DemoInvitacion = window.DemoInvitacion || {};
  ns.secciones = ns.secciones || {};

  let timerId = null;

  function render(config = {}) {
    const section = document.getElementById("fecha");
    const countdown = document.getElementById("countdown");
    if (!section || !countdown) return;

    const reloj = config.reloj || {};
    const estilo = reloj.estilo || reloj.clase || section.dataset.relojEstilo || "";
    const fechaEstilo = reloj.fechaEstilo || config.fechaEstilo || section.dataset.fechaEstilo || "";
    const eventDate = normalizeEventDate(config);
    const target = eventDate.date;
    const labels = getLabels(config, countdown);

    if (estilo) section.classList.add(estilo);
    applyClockImages(section, reloj.imagenes || {});
    if (fechaEstilo) {
      section.classList.add(fechaEstilo);
      document.querySelector(".hero-date")?.classList.add(fechaEstilo);
    }

    setText("countdown-title", reloj.titulo || "");
    setText("calendar-button", reloj.botonCalendario || "");
    renderCountdown(countdown, labels);
    paintDateText(config, eventDate);
    warnMissingDateFields(config, eventDate);

    if (timerId) window.clearInterval(timerId);
    if (target) {
      drawCountdown(target);
      timerId = window.setInterval(() => drawCountdown(target), 1000);
      bindCalendar(config, target);
    }
  }

  function renderCountdown(container, labels) {
    container.innerHTML = ["dias", "horas", "minutos", "segundos"].map(key => `
      <div class="count-box">
        <strong data-count="${key}">00</strong>
        <span>${escapeHtml(labels[key] || "")}</span>
      </div>
    `).join("");
  }

  function drawCountdown(target) {
    const diff = Math.max(target.getTime() - Date.now(), 0);
    const total = Math.floor(diff / 1000);
    const values = {
      dias: Math.floor(total / 86400),
      horas: Math.floor((total % 86400) / 3600),
      minutos: Math.floor((total % 3600) / 60),
      segundos: total % 60
    };

    Object.entries(values).forEach(([key, value]) => {
      const node = document.querySelector(`[data-count="${key}"]`);
      if (node) node.textContent = key === "dias" ? String(value) : pad(value);
    });
  }

  function paintDateText(config, eventDate) {
    const parts = getDateParts(config, eventDate.date);
    const dateText = eventDate.dateText || [parts.dia, parts.mes, parts.anio].filter(Boolean).join(" ");
    const timeText = eventDate.timeText;

    setText("date-main", dateText);
    setText("time-main", timeText);
    setText("fecha-texto", dateText);
  }

  function getTargetDate(config) {
    return normalizeEventDate(config).date;
  }

  function normalizeEventDate(config = {}) {
    const fecha = config.fecha;
    const legacy = isObject(fecha) ? fecha : {};
    const raw = readDateValue(config);
    const timeText = getTimeText(config);
    const value = raw && String(raw).includes("T") ? String(raw) : raw ? `${raw}T${to24(timeText)}:00` : "";
    const date = value ? new Date(value) : null;
    const validDate = date && !Number.isNaN(date.getTime()) ? date : null;

    // Normaliza fecha plana y conserva compatibilidad temporal con la estructura anterior.
    return {
      date: validDate,
      iso: validDate ? value : "",
      rawDate: raw,
      dateText: firstText(config.fechaTexto, legacy.texto, validDate ? formatDateFromTarget(validDate, config) : ""),
      timeText,
      hasLegacyDate: isObject(fecha) && Boolean(legacy["iso"] || legacy.fecha || legacy.valor || legacy.texto)
    };
  }

  function readDateValue(config) {
    const fecha = config.fecha;
    if (isObject(fecha)) return fecha["iso"] || fecha.fecha || fecha.valor || "";
    return fecha || config.fechaISO || "";
  }

  function formatDateFromTarget(target, config) {
    if (!target) return "";
    const locale = config.locale || document.documentElement.lang || "es-MX";
    const month = target.toLocaleDateString(locale, { month: "long" });
    const monthText = capitalize(month);
    return `${target.getDate()} . ${monthText} . ${target.getFullYear()}`;
  }

  function warnMissingDateFields(config, eventDate) {
    const fecha = config.fecha;
    const legacy = isObject(fecha) ? fecha : {};
    const missing = [];
    const hasDate = hasText(typeof fecha === "string" ? fecha : "") || hasText(legacy["iso"]) || hasText(legacy.fecha) || hasText(legacy.valor);
    const hasDateText = hasText(config.fechaTexto) || hasText(legacy.texto);
    const hasTime = hasText(config.hora) || hasText(config.horaTexto) || hasText(legacy.hora) || hasText(legacy.time) || String(eventDate.rawDate || "").includes("T");

    if (!hasDate) missing.push("fecha");
    if (!hasDateText) missing.push("fechaTexto");
    if (!hasTime) missing.push("hora");
    if (missing.length) {
      console.warn("Fecha del evento incompleta. Revisa:", missing.join(", "), {
        recomendado: { fecha: "2026-08-15", fechaTexto: "15 . Agosto . 2026", hora: "6:30 p.m." }
      });
    }
  }

  function getDateParts(config, target) {
    const fecha = config.fecha;
    if (target) {
      const locale = config.locale || document.documentElement.lang || "es-MX";
      const parts = new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "long",
        year: "numeric"
      }).formatToParts(target);
      return {
        dia: part(parts, "day"),
        mes: capitalize(part(parts, "month")),
        anio: part(parts, "year")
      };
    }

    if (isObject(fecha)) {
      return {
        dia: fecha.dia || fecha.day || "",
        mes: fecha.mes || fecha.month || "",
        anio: fecha.anio || fecha.ano || fecha.year || ""
      };
    }

    return {
      dia: config.dia || "",
      mes: config.mes || "",
      anio: config.anio || config.ano || ""
    };
  }

  function getLabels(config, container) {
    const reloj = config.reloj || {};
    const units = reloj.unidades || reloj.etiquetas || config.contador || {};
    const existing = Array.from(container.querySelectorAll("[data-count]")).reduce((acc, node) => {
      const key = node.dataset.count;
      const label = node.parentElement?.querySelector("span, small")?.textContent?.trim();
      if (key && label) acc[key] = label;
      return acc;
    }, {});

    return {
      dias: units.dias || existing.dias || "",
      horas: units.horas || existing.horas || "",
      minutos: units.minutos || existing.minutos || "",
      segundos: units.segundos || existing.segundos || ""
    };
  }

  function bindCalendar(config, target) {
    const button = document.getElementById("calendar-button");
    if (!button || button.dataset.relojBaseBound === "true") return;
    button.dataset.relojBaseBound = "true";
    button.addEventListener("click", () => downloadCalendar(config, target));
  }

  function downloadCalendar(config, start) {
    const duration = Number(config.reloj?.duracionHoras || config.duracionHoras || 6);
    const end = new Date(start.getTime() + (Number.isFinite(duration) ? duration : 6) * 60 * 60 * 1000);
    const title = [config.tituloEvento, config.nombre || config.hero?.nombre].filter(Boolean).join(" - ");
    const location = Array.isArray(config.ubicaciones)
      ? (config.ubicaciones[0]?.lugar || config.ubicaciones[0]?.nombre || config.ubicaciones[0]?.direccion || "")
      : "";
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      `SUMMARY:${escapeIcs(title)}`,
      `DTSTART:${icsDate(start)}`,
      `DTEND:${icsDate(end)}`,
      `LOCATION:${escapeIcs(location)}`,
      `DESCRIPTION:${escapeIcs(config.frase || config.metaDescripcion || "")}`,
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");

    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    link.download = `${slug(title || "evento")}.ics`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function getTimeText(config) {
    const fecha = config.fecha;
    return config.horaTexto || config.hora || (isObject(fecha) ? (fecha.horaTexto || fecha.hora || fecha.time || "") : "");
  }

  function to24(value = "00:00") {
    const clean = String(value || "00:00")
      .replace(/\./g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase()
      .replace(/\bA M\b/, "AM")
      .replace(/\bP M\b/, "PM");
    const match = clean.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
    if (!match) return "00:00";
    let hours = Number(match[1]);
    const minutes = match[2] || "00";
    const period = (match[3] || "").toUpperCase();
    if (period === "PM" && hours < 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    return `${pad(hours)}:${minutes}`;
  }

  function setText(id, value) {
    const node = document.getElementById(id);
    if (node) node.textContent = value || "";
  }

  function isObject(value) {
    return value && typeof value === "object" && !Array.isArray(value);
  }

  function part(parts, type) {
    return parts.find(item => item.type === type)?.value || "";
  }

  function capitalize(value) {
    const text = String(value || "");
    return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
  }

  function firstText(...values) {
    const value = values.find(item => hasText(item));
    return hasText(value) ? String(value).trim() : "";
  }

  function hasText(value) {
    return typeof value === "string" && value.trim().length > 0;
  }

  function pad(value) {
    return String(Math.max(0, Number(value) || 0)).padStart(2, "0");
  }

  function icsDate(date) {
    return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escapeIcs(value) {
    return String(value || "").replace(/[\\,;]/g, "\\$&").replace(/\n/g, "\\n");
  }

  function slug(value) {
    return String(value || "evento")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  ns.fecha = {
    normalizeEventDate,
    getEventDate: config => normalizeEventDate(config).date,
    getEventDateText: config => normalizeEventDate(config).dateText,
    getEventTimeText: config => normalizeEventDate(config).timeText,
    getWeekday: config => {
      const date = config instanceof Date ? config : normalizeEventDate(config).date;
      if (!date) return "";
      const text = date.toLocaleDateString(document.documentElement.lang || "es-MX", { weekday: "long" });
      return capitalize(text);
    }
  };

  ns.secciones.reloj = { render };

  function applyClockImages(section, imagenes) {
    if (!isObject(imagenes)) return;

    // MARK: RELOJ BASE - Imagenes editables desde JSON
    const imageVars = {
      // MARK: RELOJ BASE - Bella y Bestia, imagenes editables desde JSON
      topRosa: "--rbb-img-top-rosa",
      topCampana: "--rbb-img-top-campana",
      rosaLeft: "--rbb-img-rosa-left",
      velas: "--rbb-img-velas",
      libros: "--rbb-img-libros",
      campanaBottom: "--rbb-img-campana-bottom",
      vestido: "--rbb-img-vestido",
      ornamentoBottom: "--rbb-img-ornamento-bottom",
      tela: "--rbb-img-tela",
      espejo: "--rbb-img-espejo",
      filigree: "--rbb-img-filigree",
      top: ["--rvl-img-top", "--rrp-img-top", "--rps-img-top"],
      left: ["--rvl-img-left", "--rrp-img-left", "--rps-img-left"],
      right: ["--rvl-img-right", "--rrp-img-right", "--rps-img-right"],
      bottom: ["--rvl-img-bottom", "--rrp-img-bottom", "--rps-img-bottom"],
      ornamento: ["--rvl-img-ornamento", "--rv-img-ornamento", "--rrp-img-ornamento", "--rps-img-ornamento"],
      marco: ["--rvl-img-marco", "--rv-img-marco", "--rrp-img-marco", "--rps-img-marco", "--rbb-img-marco"],
      flor: "--rps-img-flor",
      farol: "--rps-img-farol",
      luciernagas: "--rps-img-luciernagas",
      gema: "--rps-img-gema",
      hojas: "--rps-img-hojas",
      lirios: "--rps-img-lirios",
      luna: "--rvl-img-luna",
      estrellas: "--rvl-img-estrellas",
      cristalLeft: "--rvl-img-cristal-left",
      cristalRight: "--rvl-img-cristal-right",
      floral: "--rrp-img-floral",
      sol: "--rrp-img-sol",
      linterna: "--rrp-img-linterna",
      florTop: "--rv-img-flor-top",
      florLeft: "--rv-img-flor-left",
      florRight: "--rv-img-flor-right",
      florBottom: "--rv-img-flor-bottom",
    };

    Object.entries(imageVars).forEach(([key, cssVar]) => {
      const value = imagenes[key];
      if (!value) return;
      const vars = Array.isArray(cssVar) ? cssVar : [cssVar];
      vars.forEach(name => section.style.setProperty(name, `url("${escapeCssUrl(value)}")`));
    });
  }

  function escapeCssUrl(value) {
    return String(value || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  }
})();
;
/* === helpers-rpcd78.js === */
(() => {
  "use strict";
  const ns = window.DemoInvitacion = window.DemoInvitacion || {};
  ns.state = ns.state || {};
  const byId = id => document.getElementById(id);
  const setText = (id, value = "") => { const el = byId(id); if (el) el.textContent = value || ""; };
  const setOptionalText = (id, value, fallback = "") => { const el = byId(id); if (!el) return; const finalValue = value ?? fallback; el.textContent = finalValue || ""; el.hidden = finalValue === ""; };
  const setAttr = (id, attr, value = "") => { const el = byId(id); if (!el) return; if (value === undefined || value === null || value === "") el.removeAttribute(attr); else el.setAttribute(attr, value); };
  const escapeHtml = (value = "") => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const safeUrl = (value = "#") => /^javascript:/i.test(String(value || "#").trim()) ? "#" : String(value || "#").trim();
  const hide = id => { if (!ns.state.preview) { const el = byId(id); if (el) el.hidden = true; } };
  const setMeta = (id, attr, value) => { const el = byId(id); if (el) el.setAttribute(attr, value || ""); };
  function whatsappUrl(phone, message) { const clean = String(phone || "").replace(/\D/g, ""); const finalPhone = clean.startsWith("52") ? clean : "52" + clean; return "https://wa.me/" + finalPhone + "?text=" + encodeURIComponent(message || ""); }
  ns.helpers = { byId, setText, setOptionalText, setAttr, escapeHtml, safeUrl, hide, setMeta, whatsappUrl };
})();
;
/* === datos-rpcd78.js === */
(() => {
  "use strict";
  const ns = window.DemoInvitacion = window.DemoInvitacion || {};

  function readInlineData() {
    try {
      const el = document.getElementById("invita-inline-data");
      if (el && el.textContent.trim()) return JSON.parse(el.textContent);
    } catch (_) {}
    return null;
  }

  async function loadConfig() {
    // 1. Try inline <script id="invita-inline-data"> first (works on file://)
    const inline = readInlineData();
    if (inline) return inline;

    // 2. Fall back to fetch (works on http/https)
    const jsonPath = document.body.dataset.demoJson || "./objeto-xv.json?cache=88";
    try {
      const response = await fetch(
        (jsonPath.includes("?") ? jsonPath : jsonPath + "?cache=88"),
        { cache: "no-store" }
      );
      if (!response.ok) return {};
      return response.json();
    } catch (e) {
      console.warn("MARK: DATOS-CONFIG-LOCAL", e);
      return {};
    }
  }

  ns.datos = { loadConfig };
})();
;
/* === tema-rpcd78.js === */
﻿(() => {
  "use strict";
  const ns = window.DemoInvitacion = window.DemoInvitacion || {};
  function apply(data) {
    const h = ns.helpers;
    if (data.theme && data.theme.bodyClass) String(data.theme.bodyClass).split(/\s+/).filter(Boolean).forEach(cls => document.body.classList.add(cls));
    const title = (data.meta && data.meta.titulo) || (data.hero && data.hero.nombre) || "Invitación XV";
    document.title = title;
    h.setMeta("meta-description", "content", (data.meta && data.meta.descripcion) || (data.hero && data.hero.frase) || title);
    h.setMeta("og-title", "content", title);
    h.setMeta("og-description", "content", (data.meta && data.meta.descripcion) || (data.hero && data.hero.frase) || "");
    h.setMeta("og-image", "content", (data.meta && data.meta.imagen) || (data.hero && data.hero.foto) || "");
    h.setMeta("twitter-image", "content", (data.meta && data.meta.imagen) || (data.hero && data.hero.foto) || "");
    renderDecor((data.theme && data.theme.decoraciones) || []);
  }
  function renderDecor(items) {
    const layer = document.querySelector(".decor-layer");
    if (!layer) return;
    layer.innerHTML = items.map(item => '<img class="' + (item.clase || '') + '" src="' + item.src + '" alt="' + (item.alt || '') + '" aria-hidden="true">').join("");
  }
  function afterSections(data) { renderOrnaments(data.ornamentos || []); renderSpiralBranches(data.ramasEspiral || []); }
  function renderOrnaments(items) {
    document.querySelectorAll(".wonder-ornament").forEach(item => item.remove());
    items.forEach(item => {
      const target = document.querySelector(item.after || "");
      if (!target || !isTargetVisible(target)) return;
      const ornament = document.createElement("div");
      ornament.className = ("wonder-ornament " + (item.clase || "")).trim();
      ornament.setAttribute("aria-hidden", "true");
      const images = item.imagenes || [];
      ornament.innerHTML = (images[0] ? '<img src="' + images[0] + '" alt="">' : '<span></span>') + '<span></span>' + (images[1] ? '<img src="' + images[1] + '" alt="">' : '<span></span>');
      target.insertAdjacentElement("afterend", ornament);
    });
  }
  function renderSpiralBranches(items) {
    document.querySelectorAll(".rama-espiral").forEach(item => item.remove());
    items.forEach((item, index) => {
      const target = document.querySelector(item.after || "");
      if (!target || !isTargetVisible(target) || !item.imagen) return;
      const imagen = String(item.imagen || "").toLowerCase();
      const sideClass = imagen.includes("-de") ? "rama-espiral--solo-right" : imagen.includes("-iz") ? "rama-espiral--solo-left" : index % 2 === 0 ? "rama-espiral--solo-left" : "rama-espiral--solo-right";
      const ornament = document.createElement("div");
      ornament.className = ("rama-espiral " + (item.clase || "") + " " + sideClass).trim();
      ornament.setAttribute("aria-hidden", "true");
      ornament.innerHTML = '<img class="rama-espiral-img" src="' + item.imagen + '" alt="">';
      target.insertAdjacentElement("afterend", ornament);
    });
  }
  function isTargetVisible(target) {
    return !target.hidden && !target.closest("[hidden], .esconder");
  }
  ns.tema = { apply, afterSections };
})();
;
/* === gsap.minaa61.js === */
/*!
 * GSAP 3.12.5
 * https://gsap.com
 * 
 * @license Copyright 2024, GreenSock. All rights reserved.
 * Subject to the terms at https://gsap.com/standard-license or for Club GSAP members, the agreement issued with that membership.
 * @author: Jack Doyle, jack@greensock.com
 */

!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?e(exports):"function"==typeof define&&define.amd?define(["exports"],e):e((t=t||self).window=t.window||{})}(this,function(e){"use strict";function _inheritsLoose(t,e){t.prototype=Object.create(e.prototype),(t.prototype.constructor=t).__proto__=e}function _assertThisInitialized(t){if(void 0===t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return t}function r(t){return"string"==typeof t}function s(t){return"function"==typeof t}function t(t){return"number"==typeof t}function u(t){return void 0===t}function v(t){return"object"==typeof t}function w(t){return!1!==t}function x(){return"undefined"!=typeof window}function y(t){return s(t)||r(t)}function P(t){return(i=yt(t,ot))&&ze}function Q(t,e){return console.warn("Invalid property",t,"set to",e,"Missing plugin? gsap.registerPlugin()")}function R(t,e){return!e&&console.warn(t)}function S(t,e){return t&&(ot[t]=e)&&i&&(i[t]=e)||ot}function T(){return 0}function ea(t){var e,r,i=t[0];if(v(i)||s(i)||(t=[t]),!(e=(i._gsap||{}).harness)){for(r=gt.length;r--&&!gt[r].targetTest(i););e=gt[r]}for(r=t.length;r--;)t[r]&&(t[r]._gsap||(t[r]._gsap=new Vt(t[r],e)))||t.splice(r,1);return t}function fa(t){return t._gsap||ea(Mt(t))[0]._gsap}function ga(t,e,r){return(r=t[e])&&s(r)?t[e]():u(r)&&t.getAttribute&&t.getAttribute(e)||r}function ha(t,e){return(t=t.split(",")).forEach(e)||t}function ia(t){return Math.round(1e5*t)/1e5||0}function ja(t){return Math.round(1e7*t)/1e7||0}function ka(t,e){var r=e.charAt(0),i=parseFloat(e.substr(2));return t=parseFloat(t),"+"===r?t+i:"-"===r?t-i:"*"===r?t*i:t/i}function la(t,e){for(var r=e.length,i=0;t.indexOf(e[i])<0&&++i<r;);return i<r}function ma(){var t,e,r=dt.length,i=dt.slice(0);for(ct={},t=dt.length=0;t<r;t++)(e=i[t])&&e._lazy&&(e.render(e._lazy[0],e._lazy[1],!0)._lazy=0)}function na(t,e,r,i){dt.length&&!L&&ma(),t.render(e,r,i||L&&e<0&&(t._initted||t._startAt)),dt.length&&!L&&ma()}function oa(t){var e=parseFloat(t);return(e||0===e)&&(t+"").match(at).length<2?e:r(t)?t.trim():t}function pa(t){return t}function qa(t,e){for(var r in e)r in t||(t[r]=e[r]);return t}function ta(t,e){for(var r in e)"__proto__"!==r&&"constructor"!==r&&"prototype"!==r&&(t[r]=v(e[r])?ta(t[r]||(t[r]={}),e[r]):e[r]);return t}function ua(t,e){var r,i={};for(r in t)r in e||(i[r]=t[r]);return i}function va(t){var e=t.parent||I,r=t.keyframes?function _setKeyframeDefaults(i){return function(t,e){for(var r in e)r in t||"duration"===r&&i||"ease"===r||(t[r]=e[r])}}(Z(t.keyframes)):qa;if(w(t.inherit))for(;e;)r(t,e.vars.defaults),e=e.parent||e._dp;return t}function xa(t,e,r,i,n){void 0===r&&(r="_first"),void 0===i&&(i="_last");var a,s=t[i];if(n)for(a=e[n];s&&s[n]>a;)s=s._prev;return s?(e._next=s._next,s._next=e):(e._next=t[r],t[r]=e),e._next?e._next._prev=e:t[i]=e,e._prev=s,e.parent=e._dp=t,e}function ya(t,e,r,i){void 0===r&&(r="_first"),void 0===i&&(i="_last");var n=e._prev,a=e._next;n?n._next=a:t[r]===e&&(t[r]=a),a?a._prev=n:t[i]===e&&(t[i]=n),e._next=e._prev=e.parent=null}function za(t,e){t.parent&&(!e||t.parent.autoRemoveChildren)&&t.parent.remove&&t.parent.remove(t),t._act=0}function Aa(t,e){if(t&&(!e||e._end>t._dur||e._start<0))for(var r=t;r;)r._dirty=1,r=r.parent;return t}function Ca(t,e,r,i){return t._startAt&&(L?t._startAt.revert(ht):t.vars.immediateRender&&!t.vars.autoRevert||t._startAt.render(e,!0,i))}function Ea(t){return t._repeat?Tt(t._tTime,t=t.duration()+t._rDelay)*t:0}function Ga(t,e){return(t-e._start)*e._ts+(0<=e._ts?0:e._dirty?e.totalDuration():e._tDur)}function Ha(t){return t._end=ja(t._start+(t._tDur/Math.abs(t._ts||t._rts||X)||0))}function Ia(t,e){var r=t._dp;return r&&r.smoothChildTiming&&t._ts&&(t._start=ja(r._time-(0<t._ts?e/t._ts:((t._dirty?t.totalDuration():t._tDur)-e)/-t._ts)),Ha(t),r._dirty||Aa(r,t)),t}function Ja(t,e){var r;if((e._time||!e._dur&&e._initted||e._start<t._time&&(e._dur||!e.add))&&(r=Ga(t.rawTime(),e),(!e._dur||Ot(0,e.totalDuration(),r)-e._tTime>X)&&e.render(r,!0)),Aa(t,e)._dp&&t._initted&&t._time>=t._dur&&t._ts){if(t._dur<t.duration())for(r=t;r._dp;)0<=r.rawTime()&&r.totalTime(r._tTime),r=r._dp;t._zTime=-X}}function Ka(e,r,i,n){return r.parent&&za(r),r._start=ja((t(i)?i:i||e!==I?xt(e,i,r):e._time)+r._delay),r._end=ja(r._start+(r.totalDuration()/Math.abs(r.timeScale())||0)),xa(e,r,"_first","_last",e._sort?"_start":0),bt(r)||(e._recent=r),n||Ja(e,r),e._ts<0&&Ia(e,e._tTime),e}function La(t,e){return(ot.ScrollTrigger||Q("scrollTrigger",e))&&ot.ScrollTrigger.create(e,t)}function Ma(t,e,r,i,n){return Qt(t,e,n),t._initted?!r&&t._pt&&!L&&(t._dur&&!1!==t.vars.lazy||!t._dur&&t.vars.lazy)&&f!==Rt.frame?(dt.push(t),t._lazy=[n,i],1):void 0:1}function Ra(t,e,r,i){var n=t._repeat,a=ja(e)||0,s=t._tTime/t._tDur;return s&&!i&&(t._time*=a/t._dur),t._dur=a,t._tDur=n?n<0?1e10:ja(a*(n+1)+t._rDelay*n):a,0<s&&!i&&Ia(t,t._tTime=t._tDur*s),t.parent&&Ha(t),r||Aa(t.parent,t),t}function Sa(t){return t instanceof Xt?Aa(t):Ra(t,t._dur)}function Va(e,r,i){var n,a,s=t(r[1]),o=(s?2:1)+(e<2?0:1),u=r[o];if(s&&(u.duration=r[1]),u.parent=i,e){for(n=u,a=i;a&&!("immediateRender"in n);)n=a.vars.defaults||{},a=w(a.vars.inherit)&&a.parent;u.immediateRender=w(n.immediateRender),e<2?u.runBackwards=1:u.startAt=r[o-1]}return new $t(r[0],u,r[1+o])}function Wa(t,e){return t||0===t?e(t):e}function Ya(t,e){return r(t)&&(e=st.exec(t))?e[1]:""}function _a(t,e){return t&&v(t)&&"length"in t&&(!e&&!t.length||t.length-1 in t&&v(t[0]))&&!t.nodeType&&t!==h}function cb(r){return r=Mt(r)[0]||R("Invalid scope")||{},function(t){var e=r.current||r.nativeElement||r;return Mt(t,e.querySelectorAll?e:e===r?R("Invalid scope")||a.createElement("div"):r)}}function db(t){return t.sort(function(){return.5-Math.random()})}function eb(t){if(s(t))return t;var p=v(t)?t:{each:t},_=jt(p.ease),m=p.from||0,g=parseFloat(p.base)||0,y={},e=0<m&&m<1,T=isNaN(m)||e,b=p.axis,w=m,x=m;return r(m)?w=x={center:.5,edges:.5,end:1}[m]||0:!e&&T&&(w=m[0],x=m[1]),function(t,e,r){var i,n,a,s,o,u,h,l,f,d=(r||p).length,c=y[d];if(!c){if(!(f="auto"===p.grid?0:(p.grid||[1,U])[1])){for(h=-U;h<(h=r[f++].getBoundingClientRect().left)&&f<d;);f<d&&f--}for(c=y[d]=[],i=T?Math.min(f,d)*w-.5:m%f,n=f===U?0:T?d*x/f-.5:m/f|0,l=U,u=h=0;u<d;u++)a=u%f-i,s=n-(u/f|0),c[u]=o=b?Math.abs("y"===b?s:a):K(a*a+s*s),h<o&&(h=o),o<l&&(l=o);"random"===m&&db(c),c.max=h-l,c.min=l,c.v=d=(parseFloat(p.amount)||parseFloat(p.each)*(d<f?d-1:b?"y"===b?d/f:f:Math.max(f,d/f))||0)*("edges"===m?-1:1),c.b=d<0?g-d:g,c.u=Ya(p.amount||p.each)||0,_=_&&d<0?Yt(_):_}return d=(c[t]-c.min)/c.max||0,ja(c.b+(_?_(d):d)*c.v)+c.u}}function fb(i){var n=Math.pow(10,((i+"").split(".")[1]||"").length);return function(e){var r=ja(Math.round(parseFloat(e)/i)*i*n);return(r-r%1)/n+(t(e)?0:Ya(e))}}function gb(h,e){var l,f,r=Z(h);return!r&&v(h)&&(l=r=h.radius||U,h.values?(h=Mt(h.values),(f=!t(h[0]))&&(l*=l)):h=fb(h.increment)),Wa(e,r?s(h)?function(t){return f=h(t),Math.abs(f-t)<=l?f:t}:function(e){for(var r,i,n=parseFloat(f?e.x:e),a=parseFloat(f?e.y:0),s=U,o=0,u=h.length;u--;)(r=f?(r=h[u].x-n)*r+(i=h[u].y-a)*i:Math.abs(h[u]-n))<s&&(s=r,o=u);return o=!l||s<=l?h[o]:e,f||o===e||t(e)?o:o+Ya(e)}:fb(h))}function hb(t,e,r,i){return Wa(Z(t)?!e:!0===r?!!(r=0):!i,function(){return Z(t)?t[~~(Math.random()*t.length)]:(r=r||1e-5)&&(i=r<1?Math.pow(10,(r+"").length-2):1)&&Math.floor(Math.round((t-r/2+Math.random()*(e-t+.99*r))/r)*r*i)/i})}function lb(e,r,t){return Wa(t,function(t){return e[~~r(t)]})}function ob(t){for(var e,r,i,n,a=0,s="";~(e=t.indexOf("random(",a));)i=t.indexOf(")",e),n="["===t.charAt(e+7),r=t.substr(e+7,i-e-7).match(n?at:tt),s+=t.substr(a,e-a)+hb(n?r:+r[0],n?0:+r[1],+r[2]||1e-5),a=i+1;return s+t.substr(a,t.length-a)}function rb(t,e,r){var i,n,a,s=t.labels,o=U;for(i in s)(n=s[i]-e)<0==!!r&&n&&o>(n=Math.abs(n))&&(a=i,o=n);return a}function tb(t){return za(t),t.scrollTrigger&&t.scrollTrigger.kill(!!L),t.progress()<1&&Ct(t,"onInterrupt"),t}function wb(t){if(t)if(t=!t.name&&t.default||t,x()||t.headless){var e=t.name,r=s(t),i=e&&!r&&t.init?function(){this._props=[]}:t,n={init:T,render:he,add:Wt,kill:ce,modifier:fe,rawVars:0},a={targetTest:0,get:0,getSetter:ne,aliases:{},register:0};if(Ft(),t!==i){if(pt[e])return;qa(i,qa(ua(t,n),a)),yt(i.prototype,yt(n,ua(t,a))),pt[i.prop=e]=i,t.targetTest&&(gt.push(i),ft[e]=1),e=("css"===e?"CSS":e.charAt(0).toUpperCase()+e.substr(1))+"Plugin"}S(e,i),t.register&&t.register(ze,i,_e)}else At.push(t)}function zb(t,e,r){return(6*(t+=t<0?1:1<t?-1:0)<1?e+(r-e)*t*6:t<.5?r:3*t<2?e+(r-e)*(2/3-t)*6:e)*St+.5|0}function Ab(e,r,i){var n,a,s,o,u,h,l,f,d,c,p=e?t(e)?[e>>16,e>>8&St,e&St]:0:zt.black;if(!p){if(","===e.substr(-1)&&(e=e.substr(0,e.length-1)),zt[e])p=zt[e];else if("#"===e.charAt(0)){if(e.length<6&&(e="#"+(n=e.charAt(1))+n+(a=e.charAt(2))+a+(s=e.charAt(3))+s+(5===e.length?e.charAt(4)+e.charAt(4):"")),9===e.length)return[(p=parseInt(e.substr(1,6),16))>>16,p>>8&St,p&St,parseInt(e.substr(7),16)/255];p=[(e=parseInt(e.substr(1),16))>>16,e>>8&St,e&St]}else if("hsl"===e.substr(0,3))if(p=c=e.match(tt),r){if(~e.indexOf("="))return p=e.match(et),i&&p.length<4&&(p[3]=1),p}else o=+p[0]%360/360,u=p[1]/100,n=2*(h=p[2]/100)-(a=h<=.5?h*(u+1):h+u-h*u),3<p.length&&(p[3]*=1),p[0]=zb(o+1/3,n,a),p[1]=zb(o,n,a),p[2]=zb(o-1/3,n,a);else p=e.match(tt)||zt.transparent;p=p.map(Number)}return r&&!c&&(n=p[0]/St,a=p[1]/St,s=p[2]/St,h=((l=Math.max(n,a,s))+(f=Math.min(n,a,s)))/2,l===f?o=u=0:(d=l-f,u=.5<h?d/(2-l-f):d/(l+f),o=l===n?(a-s)/d+(a<s?6:0):l===a?(s-n)/d+2:(n-a)/d+4,o*=60),p[0]=~~(o+.5),p[1]=~~(100*u+.5),p[2]=~~(100*h+.5)),i&&p.length<4&&(p[3]=1),p}function Bb(t){var r=[],i=[],n=-1;return t.split(Et).forEach(function(t){var e=t.match(rt)||[];r.push.apply(r,e),i.push(n+=e.length+1)}),r.c=i,r}function Cb(t,e,r){var i,n,a,s,o="",u=(t+o).match(Et),h=e?"hsla(":"rgba(",l=0;if(!u)return t;if(u=u.map(function(t){return(t=Ab(t,e,1))&&h+(e?t[0]+","+t[1]+"%,"+t[2]+"%,"+t[3]:t.join(","))+")"}),r&&(a=Bb(t),(i=r.c).join(o)!==a.c.join(o)))for(s=(n=t.replace(Et,"1").split(rt)).length-1;l<s;l++)o+=n[l]+(~i.indexOf(l)?u.shift()||h+"0,0,0,0)":(a.length?a:u.length?u:r).shift());if(!n)for(s=(n=t.split(Et)).length-1;l<s;l++)o+=n[l]+u[l];return o+n[s]}function Fb(t){var e,r=t.join(" ");if(Et.lastIndex=0,Et.test(r))return e=Dt.test(r),t[1]=Cb(t[1],e),t[0]=Cb(t[0],e,Bb(t[1])),!0}function Ob(t){var e=(t+"").split("("),r=Lt[e[0]];return r&&1<e.length&&r.config?r.config.apply(null,~t.indexOf("{")?[function _parseObjectInString(t){for(var e,r,i,n={},a=t.substr(1,t.length-3).split(":"),s=a[0],o=1,u=a.length;o<u;o++)r=a[o],e=o!==u-1?r.lastIndexOf(","):r.length,i=r.substr(0,e),n[s]=isNaN(i)?i.replace(Bt,"").trim():+i,s=r.substr(e+1).trim();return n}(e[1])]:function _valueInParentheses(t){var e=t.indexOf("(")+1,r=t.indexOf(")"),i=t.indexOf("(",e);return t.substring(e,~i&&i<r?t.indexOf(")",r+1):r)}(t).split(",").map(oa)):Lt._CE&&It.test(t)?Lt._CE("",t):r}function Qb(t,e){for(var r,i=t._first;i;)i instanceof Xt?Qb(i,e):!i.vars.yoyoEase||i._yoyo&&i._repeat||i._yoyo===e||(i.timeline?Qb(i.timeline,e):(r=i._ease,i._ease=i._yEase,i._yEase=r,i._yoyo=e)),i=i._next}function Sb(t,e,r,i){void 0===r&&(r=function easeOut(t){return 1-e(1-t)}),void 0===i&&(i=function easeInOut(t){return t<.5?e(2*t)/2:1-e(2*(1-t))/2});var n,a={easeIn:e,easeOut:r,easeInOut:i};return ha(t,function(t){for(var e in Lt[t]=ot[t]=a,Lt[n=t.toLowerCase()]=r,a)Lt[n+("easeIn"===e?".in":"easeOut"===e?".out":".inOut")]=Lt[t+"."+e]=a[e]}),a}function Tb(e){return function(t){return t<.5?(1-e(1-2*t))/2:.5+e(2*(t-.5))/2}}function Ub(r,t,e){function Jm(t){return 1===t?1:i*Math.pow(2,-10*t)*H((t-a)*n)+1}var i=1<=t?t:1,n=(e||(r?.3:.45))/(t<1?t:1),a=n/N*(Math.asin(1/i)||0),s="out"===r?Jm:"in"===r?function(t){return 1-Jm(1-t)}:Tb(Jm);return n=N/n,s.config=function(t,e){return Ub(r,t,e)},s}function Vb(e,r){function Rm(t){return t?--t*t*((r+1)*t+r)+1:0}void 0===r&&(r=1.70158);var t="out"===e?Rm:"in"===e?function(t){return 1-Rm(1-t)}:Tb(Rm);return t.config=function(t){return Vb(e,t)},t}var F,L,l,I,h,n,a,i,o,f,d,c,p,_,m,g,b,O,k,M,C,A,z,E,D,B,Y,j,q={autoSleep:120,force3D:"auto",nullTargetWarn:1,units:{lineHeight:""}},V={duration:.5,overwrite:!1,delay:0},U=1e8,X=1/U,N=2*Math.PI,G=N/4,W=0,K=Math.sqrt,J=Math.cos,H=Math.sin,$="function"==typeof ArrayBuffer&&ArrayBuffer.isView||function(){},Z=Array.isArray,tt=/(?:-?\.?\d|\.)+/gi,et=/[-+=.]*\d+[.e\-+]*\d*[e\-+]*\d*/g,rt=/[-+=.]*\d+[.e-]*\d*[a-z%]*/g,it=/[-+=.]*\d+\.?\d*(?:e-|e\+)?\d*/gi,nt=/[+-]=-?[.\d]+/,at=/[^,'"\[\]\s]+/gi,st=/^[+\-=e\s\d]*\d+[.\d]*([a-z]*|%)\s*$/i,ot={},ut={suppressEvents:!0,isStart:!0,kill:!1},ht={suppressEvents:!0,kill:!1},lt={suppressEvents:!0},ft={},dt=[],ct={},pt={},_t={},mt=30,gt=[],vt="",yt=function _merge(t,e){for(var r in e)t[r]=e[r];return t},Tt=function _animationCycle(t,e){var r=Math.floor(t/=e);return t&&r===t?r-1:r},bt=function _isFromOrFromStart(t){var e=t.data;return"isFromStart"===e||"isStart"===e},wt={_start:0,endTime:T,totalDuration:T},xt=function _parsePosition(t,e,i){var n,a,s,o=t.labels,u=t._recent||wt,h=t.duration()>=U?u.endTime(!1):t._dur;return r(e)&&(isNaN(e)||e in o)?(a=e.charAt(0),s="%"===e.substr(-1),n=e.indexOf("="),"<"===a||">"===a?(0<=n&&(e=e.replace(/=/,"")),("<"===a?u._start:u.endTime(0<=u._repeat))+(parseFloat(e.substr(1))||0)*(s?(n<0?u:i).totalDuration()/100:1)):n<0?(e in o||(o[e]=h),o[e]):(a=parseFloat(e.charAt(n-1)+e.substr(n+1)),s&&i&&(a=a/100*(Z(i)?i[0]:i).totalDuration()),1<n?_parsePosition(t,e.substr(0,n-1),i)+a:h+a)):null==e?h:+e},Ot=function _clamp(t,e,r){return r<t?t:e<r?e:r},kt=[].slice,Mt=function toArray(t,e,i){return l&&!e&&l.selector?l.selector(t):!r(t)||i||!n&&Ft()?Z(t)?function _flatten(t,e,i){return void 0===i&&(i=[]),t.forEach(function(t){return r(t)&&!e||_a(t,1)?i.push.apply(i,Mt(t)):i.push(t)})||i}(t,i):_a(t)?kt.call(t,0):t?[t]:[]:kt.call((e||a).querySelectorAll(t),0)},Pt=function mapRange(e,t,r,i,n){var a=t-e,s=i-r;return Wa(n,function(t){return r+((t-e)/a*s||0)})},Ct=function _callback(t,e,r){var i,n,a,s=t.vars,o=s[e],u=l,h=t._ctx;if(o)return i=s[e+"Params"],n=s.callbackScope||t,r&&dt.length&&ma(),h&&(l=h),a=i?o.apply(n,i):o.call(n),l=u,a},At=[],St=255,zt={aqua:[0,St,St],lime:[0,St,0],silver:[192,192,192],black:[0,0,0],maroon:[128,0,0],teal:[0,128,128],blue:[0,0,St],navy:[0,0,128],white:[St,St,St],olive:[128,128,0],yellow:[St,St,0],orange:[St,165,0],gray:[128,128,128],purple:[128,0,128],green:[0,128,0],red:[St,0,0],pink:[St,192,203],cyan:[0,St,St],transparent:[St,St,St,0]},Et=function(){var t,e="(?:\\b(?:(?:rgb|rgba|hsl|hsla)\\(.+?\\))|\\B#(?:[0-9a-f]{3,4}){1,2}\\b";for(t in zt)e+="|"+t+"\\b";return new RegExp(e+")","gi")}(),Dt=/hsl[a]?\(/,Rt=(k=Date.now,M=500,C=33,A=k(),z=A,D=E=1e3/240,g={time:0,frame:0,tick:function tick(){yl(!0)},deltaRatio:function deltaRatio(t){return b/(1e3/(t||60))},wake:function wake(){o&&(!n&&x()&&(h=n=window,a=h.document||{},ot.gsap=ze,(h.gsapVersions||(h.gsapVersions=[])).push(ze.version),P(i||h.GreenSockGlobals||!h.gsap&&h||{}),At.forEach(wb)),m="undefined"!=typeof requestAnimationFrame&&requestAnimationFrame,p&&g.sleep(),_=m||function(t){return setTimeout(t,D-1e3*g.time+1|0)},c=1,yl(2))},sleep:function sleep(){(m?cancelAnimationFrame:clearTimeout)(p),c=0,_=T},lagSmoothing:function lagSmoothing(t,e){M=t||1/0,C=Math.min(e||33,M)},fps:function fps(t){E=1e3/(t||240),D=1e3*g.time+E},add:function add(n,t,e){var a=t?function(t,e,r,i){n(t,e,r,i),g.remove(a)}:n;return g.remove(n),B[e?"unshift":"push"](a),Ft(),a},remove:function remove(t,e){~(e=B.indexOf(t))&&B.splice(e,1)&&e<=O&&O--},_listeners:B=[]}),Ft=function _wake(){return!c&&Rt.wake()},Lt={},It=/^[\d.\-M][\d.\-,\s]/,Bt=/["']/g,Yt=function _invertEase(e){return function(t){return 1-e(1-t)}},jt=function _parseEase(t,e){return t&&(s(t)?t:Lt[t]||Ob(t))||e};function yl(t){var e,r,i,n,a=k()-z,s=!0===t;if((M<a||a<0)&&(A+=a-C),(0<(e=(i=(z+=a)-A)-D)||s)&&(n=++g.frame,b=i-1e3*g.time,g.time=i/=1e3,D+=e+(E<=e?4:E-e),r=1),s||(p=_(yl)),r)for(O=0;O<B.length;O++)B[O](i,b,n,t)}function gn(t){return t<j?Y*t*t:t<.7272727272727273?Y*Math.pow(t-1.5/2.75,2)+.75:t<.9090909090909092?Y*(t-=2.25/2.75)*t+.9375:Y*Math.pow(t-2.625/2.75,2)+.984375}ha("Linear,Quad,Cubic,Quart,Quint,Strong",function(t,e){var r=e<5?e+1:e;Sb(t+",Power"+(r-1),e?function(t){return Math.pow(t,r)}:function(t){return t},function(t){return 1-Math.pow(1-t,r)},function(t){return t<.5?Math.pow(2*t,r)/2:1-Math.pow(2*(1-t),r)/2})}),Lt.Linear.easeNone=Lt.none=Lt.Linear.easeIn,Sb("Elastic",Ub("in"),Ub("out"),Ub()),Y=7.5625,j=1/2.75,Sb("Bounce",function(t){return 1-gn(1-t)},gn),Sb("Expo",function(t){return t?Math.pow(2,10*(t-1)):0}),Sb("Circ",function(t){return-(K(1-t*t)-1)}),Sb("Sine",function(t){return 1===t?1:1-J(t*G)}),Sb("Back",Vb("in"),Vb("out"),Vb()),Lt.SteppedEase=Lt.steps=ot.SteppedEase={config:function config(t,e){void 0===t&&(t=1);var r=1/t,i=t+(e?0:1),n=e?1:0;return function(t){return((i*Ot(0,.99999999,t)|0)+n)*r}}},V.ease=Lt["quad.out"],ha("onComplete,onUpdate,onStart,onRepeat,onReverseComplete,onInterrupt",function(t){return vt+=t+","+t+"Params,"});var qt,Vt=function GSCache(t,e){this.id=W++,(t._gsap=this).target=t,this.harness=e,this.get=e?e.get:ga,this.set=e?e.getSetter:ne},Ut=((qt=Animation.prototype).delay=function delay(t){return t||0===t?(this.parent&&this.parent.smoothChildTiming&&this.startTime(this._start+t-this._delay),this._delay=t,this):this._delay},qt.duration=function duration(t){return arguments.length?this.totalDuration(0<this._repeat?t+(t+this._rDelay)*this._repeat:t):this.totalDuration()&&this._dur},qt.totalDuration=function totalDuration(t){return arguments.length?(this._dirty=0,Ra(this,this._repeat<0?t:(t-this._repeat*this._rDelay)/(this._repeat+1))):this._tDur},qt.totalTime=function totalTime(t,e){if(Ft(),!arguments.length)return this._tTime;var r=this._dp;if(r&&r.smoothChildTiming&&this._ts){for(Ia(this,t),!r._dp||r.parent||Ja(r,this);r&&r.parent;)r.parent._time!==r._start+(0<=r._ts?r._tTime/r._ts:(r.totalDuration()-r._tTime)/-r._ts)&&r.totalTime(r._tTime,!0),r=r.parent;!this.parent&&this._dp.autoRemoveChildren&&(0<this._ts&&t<this._tDur||this._ts<0&&0<t||!this._tDur&&!t)&&Ka(this._dp,this,this._start-this._delay)}return(this._tTime!==t||!this._dur&&!e||this._initted&&Math.abs(this._zTime)===X||!t&&!this._initted&&(this.add||this._ptLookup))&&(this._ts||(this._pTime=t),na(this,t,e)),this},qt.time=function time(t,e){return arguments.length?this.totalTime(Math.min(this.totalDuration(),t+Ea(this))%(this._dur+this._rDelay)||(t?this._dur:0),e):this._time},qt.totalProgress=function totalProgress(t,e){return arguments.length?this.totalTime(this.totalDuration()*t,e):this.totalDuration()?Math.min(1,this._tTime/this._tDur):0<this.rawTime()?1:0},qt.progress=function progress(t,e){return arguments.length?this.totalTime(this.duration()*(!this._yoyo||1&this.iteration()?t:1-t)+Ea(this),e):this.duration()?Math.min(1,this._time/this._dur):0<this.rawTime()?1:0},qt.iteration=function iteration(t,e){var r=this.duration()+this._rDelay;return arguments.length?this.totalTime(this._time+(t-1)*r,e):this._repeat?Tt(this._tTime,r)+1:1},qt.timeScale=function timeScale(t,e){if(!arguments.length)return this._rts===-X?0:this._rts;if(this._rts===t)return this;var r=this.parent&&this._ts?Ga(this.parent._time,this):this._tTime;return this._rts=+t||0,this._ts=this._ps||t===-X?0:this._rts,this.totalTime(Ot(-Math.abs(this._delay),this._tDur,r),!1!==e),Ha(this),function _recacheAncestors(t){for(var e=t.parent;e&&e.parent;)e._dirty=1,e.totalDuration(),e=e.parent;return t}(this)},qt.paused=function paused(t){return arguments.length?(this._ps!==t&&((this._ps=t)?(this._pTime=this._tTime||Math.max(-this._delay,this.rawTime()),this._ts=this._act=0):(Ft(),this._ts=this._rts,this.totalTime(this.parent&&!this.parent.smoothChildTiming?this.rawTime():this._tTime||this._pTime,1===this.progress()&&Math.abs(this._zTime)!==X&&(this._tTime-=X)))),this):this._ps},qt.startTime=function startTime(t){if(arguments.length){this._start=t;var e=this.parent||this._dp;return!e||!e._sort&&this.parent||Ka(e,this,t-this._delay),this}return this._start},qt.endTime=function endTime(t){return this._start+(w(t)?this.totalDuration():this.duration())/Math.abs(this._ts||1)},qt.rawTime=function rawTime(t){var e=this.parent||this._dp;return e?t&&(!this._ts||this._repeat&&this._time&&this.totalProgress()<1)?this._tTime%(this._dur+this._rDelay):this._ts?Ga(e.rawTime(t),this):this._tTime:this._tTime},qt.revert=function revert(t){void 0===t&&(t=lt);var e=L;return L=t,(this._initted||this._startAt)&&(this.timeline&&this.timeline.revert(t),this.totalTime(-.01,t.suppressEvents)),"nested"!==this.data&&!1!==t.kill&&this.kill(),L=e,this},qt.globalTime=function globalTime(t){for(var e=this,r=arguments.length?t:e.rawTime();e;)r=e._start+r/(Math.abs(e._ts)||1),e=e._dp;return!this.parent&&this._sat?this._sat.globalTime(t):r},qt.repeat=function repeat(t){return arguments.length?(this._repeat=t===1/0?-2:t,Sa(this)):-2===this._repeat?1/0:this._repeat},qt.repeatDelay=function repeatDelay(t){if(arguments.length){var e=this._time;return this._rDelay=t,Sa(this),e?this.time(e):this}return this._rDelay},qt.yoyo=function yoyo(t){return arguments.length?(this._yoyo=t,this):this._yoyo},qt.seek=function seek(t,e){return this.totalTime(xt(this,t),w(e))},qt.restart=function restart(t,e){return this.play().totalTime(t?-this._delay:0,w(e))},qt.play=function play(t,e){return null!=t&&this.seek(t,e),this.reversed(!1).paused(!1)},qt.reverse=function reverse(t,e){return null!=t&&this.seek(t||this.totalDuration(),e),this.reversed(!0).paused(!1)},qt.pause=function pause(t,e){return null!=t&&this.seek(t,e),this.paused(!0)},qt.resume=function resume(){return this.paused(!1)},qt.reversed=function reversed(t){return arguments.length?(!!t!==this.reversed()&&this.timeScale(-this._rts||(t?-X:0)),this):this._rts<0},qt.invalidate=function invalidate(){return this._initted=this._act=0,this._zTime=-X,this},qt.isActive=function isActive(){var t,e=this.parent||this._dp,r=this._start;return!(e&&!(this._ts&&this._initted&&e.isActive()&&(t=e.rawTime(!0))>=r&&t<this.endTime(!0)-X))},qt.eventCallback=function eventCallback(t,e,r){var i=this.vars;return 1<arguments.length?(e?(i[t]=e,r&&(i[t+"Params"]=r),"onUpdate"===t&&(this._onUpdate=e)):delete i[t],this):i[t]},qt.then=function then(t){var i=this;return new Promise(function(e){function Co(){var t=i.then;i.then=null,s(r)&&(r=r(i))&&(r.then||r===i)&&(i.then=t),e(r),i.then=t}var r=s(t)?t:pa;i._initted&&1===i.totalProgress()&&0<=i._ts||!i._tTime&&i._ts<0?Co():i._prom=Co})},qt.kill=function kill(){tb(this)},Animation);function Animation(t){this.vars=t,this._delay=+t.delay||0,(this._repeat=t.repeat===1/0?-2:t.repeat||0)&&(this._rDelay=t.repeatDelay||0,this._yoyo=!!t.yoyo||!!t.yoyoEase),this._ts=1,Ra(this,+t.duration,1,1),this.data=t.data,l&&(this._ctx=l).data.push(this),c||Rt.wake()}qa(Ut.prototype,{_time:0,_start:0,_end:0,_tTime:0,_tDur:0,_dirty:0,_repeat:0,_yoyo:!1,parent:null,_initted:!1,_rDelay:0,_ts:1,_dp:0,ratio:0,_zTime:-X,_prom:0,_ps:!1,_rts:1});var Xt=function(i){function Timeline(t,e){var r;return void 0===t&&(t={}),(r=i.call(this,t)||this).labels={},r.smoothChildTiming=!!t.smoothChildTiming,r.autoRemoveChildren=!!t.autoRemoveChildren,r._sort=w(t.sortChildren),I&&Ka(t.parent||I,_assertThisInitialized(r),e),t.reversed&&r.reverse(),t.paused&&r.paused(!0),t.scrollTrigger&&La(_assertThisInitialized(r),t.scrollTrigger),r}_inheritsLoose(Timeline,i);var e=Timeline.prototype;return e.to=function to(t,e,r){return Va(0,arguments,this),this},e.from=function from(t,e,r){return Va(1,arguments,this),this},e.fromTo=function fromTo(t,e,r,i){return Va(2,arguments,this),this},e.set=function set(t,e,r){return e.duration=0,e.parent=this,va(e).repeatDelay||(e.repeat=0),e.immediateRender=!!e.immediateRender,new $t(t,e,xt(this,r),1),this},e.call=function call(t,e,r){return Ka(this,$t.delayedCall(0,t,e),r)},e.staggerTo=function staggerTo(t,e,r,i,n,a,s){return r.duration=e,r.stagger=r.stagger||i,r.onComplete=a,r.onCompleteParams=s,r.parent=this,new $t(t,r,xt(this,n)),this},e.staggerFrom=function staggerFrom(t,e,r,i,n,a,s){return r.runBackwards=1,va(r).immediateRender=w(r.immediateRender),this.staggerTo(t,e,r,i,n,a,s)},e.staggerFromTo=function staggerFromTo(t,e,r,i,n,a,s,o){return i.startAt=r,va(i).immediateRender=w(i.immediateRender),this.staggerTo(t,e,i,n,a,s,o)},e.render=function render(t,e,r){var i,n,a,s,o,u,h,l,f,d,c,p,_=this._time,m=this._dirty?this.totalDuration():this._tDur,g=this._dur,v=t<=0?0:ja(t),y=this._zTime<0!=t<0&&(this._initted||!g);if(this!==I&&m<v&&0<=t&&(v=m),v!==this._tTime||r||y){if(_!==this._time&&g&&(v+=this._time-_,t+=this._time-_),i=v,f=this._start,u=!(l=this._ts),y&&(g||(_=this._zTime),!t&&e||(this._zTime=t)),this._repeat){if(c=this._yoyo,o=g+this._rDelay,this._repeat<-1&&t<0)return this.totalTime(100*o+t,e,r);if(i=ja(v%o),v===m?(s=this._repeat,i=g):((s=~~(v/o))&&s===v/o&&(i=g,s--),g<i&&(i=g)),d=Tt(this._tTime,o),!_&&this._tTime&&d!==s&&this._tTime-d*o-this._dur<=0&&(d=s),c&&1&s&&(i=g-i,p=1),s!==d&&!this._lock){var T=c&&1&d,b=T===(c&&1&s);if(s<d&&(T=!T),_=T?0:v%g?g:v,this._lock=1,this.render(_||(p?0:ja(s*o)),e,!g)._lock=0,this._tTime=v,!e&&this.parent&&Ct(this,"onRepeat"),this.vars.repeatRefresh&&!p&&(this.invalidate()._lock=1),_&&_!==this._time||u!=!this._ts||this.vars.onRepeat&&!this.parent&&!this._act)return this;if(g=this._dur,m=this._tDur,b&&(this._lock=2,_=T?g:-1e-4,this.render(_,!0),this.vars.repeatRefresh&&!p&&this.invalidate()),this._lock=0,!this._ts&&!u)return this;Qb(this,p)}}if(this._hasPause&&!this._forcing&&this._lock<2&&(h=function _findNextPauseTween(t,e,r){var i;if(e<r)for(i=t._first;i&&i._start<=r;){if("isPause"===i.data&&i._start>e)return i;i=i._next}else for(i=t._last;i&&i._start>=r;){if("isPause"===i.data&&i._start<e)return i;i=i._prev}}(this,ja(_),ja(i)))&&(v-=i-(i=h._start)),this._tTime=v,this._time=i,this._act=!l,this._initted||(this._onUpdate=this.vars.onUpdate,this._initted=1,this._zTime=t,_=0),!_&&i&&!e&&!s&&(Ct(this,"onStart"),this._tTime!==v))return this;if(_<=i&&0<=t)for(n=this._first;n;){if(a=n._next,(n._act||i>=n._start)&&n._ts&&h!==n){if(n.parent!==this)return this.render(t,e,r);if(n.render(0<n._ts?(i-n._start)*n._ts:(n._dirty?n.totalDuration():n._tDur)+(i-n._start)*n._ts,e,r),i!==this._time||!this._ts&&!u){h=0,a&&(v+=this._zTime=-X);break}}n=a}else{n=this._last;for(var w=t<0?t:i;n;){if(a=n._prev,(n._act||w<=n._end)&&n._ts&&h!==n){if(n.parent!==this)return this.render(t,e,r);if(n.render(0<n._ts?(w-n._start)*n._ts:(n._dirty?n.totalDuration():n._tDur)+(w-n._start)*n._ts,e,r||L&&(n._initted||n._startAt)),i!==this._time||!this._ts&&!u){h=0,a&&(v+=this._zTime=w?-X:X);break}}n=a}}if(h&&!e&&(this.pause(),h.render(_<=i?0:-X)._zTime=_<=i?1:-1,this._ts))return this._start=f,Ha(this),this.render(t,e,r);this._onUpdate&&!e&&Ct(this,"onUpdate",!0),(v===m&&this._tTime>=this.totalDuration()||!v&&_)&&(f!==this._start&&Math.abs(l)===Math.abs(this._ts)||this._lock||(!t&&g||!(v===m&&0<this._ts||!v&&this._ts<0)||za(this,1),e||t<0&&!_||!v&&!_&&m||(Ct(this,v===m&&0<=t?"onComplete":"onReverseComplete",!0),!this._prom||v<m&&0<this.timeScale()||this._prom())))}return this},e.add=function add(e,i){var n=this;if(t(i)||(i=xt(this,i,e)),!(e instanceof Ut)){if(Z(e))return e.forEach(function(t){return n.add(t,i)}),this;if(r(e))return this.addLabel(e,i);if(!s(e))return this;e=$t.delayedCall(0,e)}return this!==e?Ka(this,e,i):this},e.getChildren=function getChildren(t,e,r,i){void 0===t&&(t=!0),void 0===e&&(e=!0),void 0===r&&(r=!0),void 0===i&&(i=-U);for(var n=[],a=this._first;a;)a._start>=i&&(a instanceof $t?e&&n.push(a):(r&&n.push(a),t&&n.push.apply(n,a.getChildren(!0,e,r)))),a=a._next;return n},e.getById=function getById(t){for(var e=this.getChildren(1,1,1),r=e.length;r--;)if(e[r].vars.id===t)return e[r]},e.remove=function remove(t){return r(t)?this.removeLabel(t):s(t)?this.killTweensOf(t):(ya(this,t),t===this._recent&&(this._recent=this._last),Aa(this))},e.totalTime=function totalTime(t,e){return arguments.length?(this._forcing=1,!this._dp&&this._ts&&(this._start=ja(Rt.time-(0<this._ts?t/this._ts:(this.totalDuration()-t)/-this._ts))),i.prototype.totalTime.call(this,t,e),this._forcing=0,this):this._tTime},e.addLabel=function addLabel(t,e){return this.labels[t]=xt(this,e),this},e.removeLabel=function removeLabel(t){return delete this.labels[t],this},e.addPause=function addPause(t,e,r){var i=$t.delayedCall(0,e||T,r);return i.data="isPause",this._hasPause=1,Ka(this,i,xt(this,t))},e.removePause=function removePause(t){var e=this._first;for(t=xt(this,t);e;)e._start===t&&"isPause"===e.data&&za(e),e=e._next},e.killTweensOf=function killTweensOf(t,e,r){for(var i=this.getTweensOf(t,r),n=i.length;n--;)Nt!==i[n]&&i[n].kill(t,e);return this},e.getTweensOf=function getTweensOf(e,r){for(var i,n=[],a=Mt(e),s=this._first,o=t(r);s;)s instanceof $t?la(s._targets,a)&&(o?(!Nt||s._initted&&s._ts)&&s.globalTime(0)<=r&&s.globalTime(s.totalDuration())>r:!r||s.isActive())&&n.push(s):(i=s.getTweensOf(a,r)).length&&n.push.apply(n,i),s=s._next;return n},e.tweenTo=function tweenTo(t,e){e=e||{};var r,i=this,n=xt(i,t),a=e.startAt,s=e.onStart,o=e.onStartParams,u=e.immediateRender,h=$t.to(i,qa({ease:e.ease||"none",lazy:!1,immediateRender:!1,time:n,overwrite:"auto",duration:e.duration||Math.abs((n-(a&&"time"in a?a.time:i._time))/i.timeScale())||X,onStart:function onStart(){if(i.pause(),!r){var t=e.duration||Math.abs((n-(a&&"time"in a?a.time:i._time))/i.timeScale());h._dur!==t&&Ra(h,t,0,1).render(h._time,!0,!0),r=1}s&&s.apply(h,o||[])}},e));return u?h.render(0):h},e.tweenFromTo=function tweenFromTo(t,e,r){return this.tweenTo(e,qa({startAt:{time:xt(this,t)}},r))},e.recent=function recent(){return this._recent},e.nextLabel=function nextLabel(t){return void 0===t&&(t=this._time),rb(this,xt(this,t))},e.previousLabel=function previousLabel(t){return void 0===t&&(t=this._time),rb(this,xt(this,t),1)},e.currentLabel=function currentLabel(t){return arguments.length?this.seek(t,!0):this.previousLabel(this._time+X)},e.shiftChildren=function shiftChildren(t,e,r){void 0===r&&(r=0);for(var i,n=this._first,a=this.labels;n;)n._start>=r&&(n._start+=t,n._end+=t),n=n._next;if(e)for(i in a)a[i]>=r&&(a[i]+=t);return Aa(this)},e.invalidate=function invalidate(t){var e=this._first;for(this._lock=0;e;)e.invalidate(t),e=e._next;return i.prototype.invalidate.call(this,t)},e.clear=function clear(t){void 0===t&&(t=!0);for(var e,r=this._first;r;)e=r._next,this.remove(r),r=e;return this._dp&&(this._time=this._tTime=this._pTime=0),t&&(this.labels={}),Aa(this)},e.totalDuration=function totalDuration(t){var e,r,i,n=0,a=this,s=a._last,o=U;if(arguments.length)return a.timeScale((a._repeat<0?a.duration():a.totalDuration())/(a.reversed()?-t:t));if(a._dirty){for(i=a.parent;s;)e=s._prev,s._dirty&&s.totalDuration(),o<(r=s._start)&&a._sort&&s._ts&&!a._lock?(a._lock=1,Ka(a,s,r-s._delay,1)._lock=0):o=r,r<0&&s._ts&&(n-=r,(!i&&!a._dp||i&&i.smoothChildTiming)&&(a._start+=r/a._ts,a._time-=r,a._tTime-=r),a.shiftChildren(-r,!1,-Infinity),o=0),s._end>n&&s._ts&&(n=s._end),s=e;Ra(a,a===I&&a._time>n?a._time:n,1,1),a._dirty=0}return a._tDur},Timeline.updateRoot=function updateRoot(t){if(I._ts&&(na(I,Ga(t,I)),f=Rt.frame),Rt.frame>=mt){mt+=q.autoSleep||120;var e=I._first;if((!e||!e._ts)&&q.autoSleep&&Rt._listeners.length<2){for(;e&&!e._ts;)e=e._next;e||Rt.sleep()}}},Timeline}(Ut);qa(Xt.prototype,{_lock:0,_hasPause:0,_forcing:0});function ac(t,e,i,n,a,o){var u,h,l,f;if(pt[t]&&!1!==(u=new pt[t]).init(a,u.rawVars?e[t]:function _processVars(t,e,i,n,a){if(s(t)&&(t=Kt(t,a,e,i,n)),!v(t)||t.style&&t.nodeType||Z(t)||$(t))return r(t)?Kt(t,a,e,i,n):t;var o,u={};for(o in t)u[o]=Kt(t[o],a,e,i,n);return u}(e[t],n,a,o,i),i,n,o)&&(i._pt=h=new _e(i._pt,a,t,0,1,u.render,u,0,u.priority),i!==d))for(l=i._ptLookup[i._targets.indexOf(a)],f=u._props.length;f--;)l[u._props[f]]=h;return u}function gc(t,r,e,i){var n,a,s=r.ease||i||"power1.inOut";if(Z(r))a=e[t]||(e[t]=[]),r.forEach(function(t,e){return a.push({t:e/(r.length-1)*100,v:t,e:s})});else for(n in r)a=e[n]||(e[n]=[]),"ease"===n||a.push({t:parseFloat(t),v:r[n],e:s})}var Nt,Gt,Wt=function _addPropTween(t,e,i,n,a,o,u,h,l,f){s(n)&&(n=n(a||0,t,o));var d,c=t[e],p="get"!==i?i:s(c)?l?t[e.indexOf("set")||!s(t["get"+e.substr(3)])?e:"get"+e.substr(3)](l):t[e]():c,_=s(c)?l?re:te:Zt;if(r(n)&&(~n.indexOf("random(")&&(n=ob(n)),"="===n.charAt(1)&&(!(d=ka(p,n)+(Ya(p)||0))&&0!==d||(n=d))),!f||p!==n||Gt)return isNaN(p*n)||""===n?(c||e in t||Q(e,n),function _addComplexStringPropTween(t,e,r,i,n,a,s){var o,u,h,l,f,d,c,p,_=new _e(this._pt,t,e,0,1,ue,null,n),m=0,g=0;for(_.b=r,_.e=i,r+="",(c=~(i+="").indexOf("random("))&&(i=ob(i)),a&&(a(p=[r,i],t,e),r=p[0],i=p[1]),u=r.match(it)||[];o=it.exec(i);)l=o[0],f=i.substring(m,o.index),h?h=(h+1)%5:"rgba("===f.substr(-5)&&(h=1),l!==u[g++]&&(d=parseFloat(u[g-1])||0,_._pt={_next:_._pt,p:f||1===g?f:",",s:d,c:"="===l.charAt(1)?ka(d,l)-d:parseFloat(l)-d,m:h&&h<4?Math.round:0},m=it.lastIndex);return _.c=m<i.length?i.substring(m,i.length):"",_.fp=s,(nt.test(i)||c)&&(_.e=0),this._pt=_}.call(this,t,e,p,n,_,h||q.stringFilter,l)):(d=new _e(this._pt,t,e,+p||0,n-(p||0),"boolean"==typeof c?se:ae,0,_),l&&(d.fp=l),u&&d.modifier(u,this,t),this._pt=d)},Qt=function _initTween(t,e,r){var i,n,a,s,o,u,h,l,f,d,c,p,_,m=t.vars,g=m.ease,v=m.startAt,y=m.immediateRender,T=m.lazy,b=m.onUpdate,x=m.runBackwards,O=m.yoyoEase,k=m.keyframes,M=m.autoRevert,P=t._dur,C=t._startAt,A=t._targets,S=t.parent,z=S&&"nested"===S.data?S.vars.targets:A,E="auto"===t._overwrite&&!F,D=t.timeline;if(!D||k&&g||(g="none"),t._ease=jt(g,V.ease),t._yEase=O?Yt(jt(!0===O?g:O,V.ease)):0,O&&t._yoyo&&!t._repeat&&(O=t._yEase,t._yEase=t._ease,t._ease=O),t._from=!D&&!!m.runBackwards,!D||k&&!m.stagger){if(p=(l=A[0]?fa(A[0]).harness:0)&&m[l.prop],i=ua(m,ft),C&&(C._zTime<0&&C.progress(1),e<0&&x&&y&&!M?C.render(-1,!0):C.revert(x&&P?ht:ut),C._lazy=0),v){if(za(t._startAt=$t.set(A,qa({data:"isStart",overwrite:!1,parent:S,immediateRender:!0,lazy:!C&&w(T),startAt:null,delay:0,onUpdate:b&&function(){return Ct(t,"onUpdate")},stagger:0},v))),t._startAt._dp=0,t._startAt._sat=t,e<0&&(L||!y&&!M)&&t._startAt.revert(ht),y&&P&&e<=0&&r<=0)return void(e&&(t._zTime=e))}else if(x&&P&&!C)if(e&&(y=!1),a=qa({overwrite:!1,data:"isFromStart",lazy:y&&!C&&w(T),immediateRender:y,stagger:0,parent:S},i),p&&(a[l.prop]=p),za(t._startAt=$t.set(A,a)),t._startAt._dp=0,t._startAt._sat=t,e<0&&(L?t._startAt.revert(ht):t._startAt.render(-1,!0)),t._zTime=e,y){if(!e)return}else _initTween(t._startAt,X,X);for(t._pt=t._ptCache=0,T=P&&w(T)||T&&!P,n=0;n<A.length;n++){if(h=(o=A[n])._gsap||ea(A)[n]._gsap,t._ptLookup[n]=d={},ct[h.id]&&dt.length&&ma(),c=z===A?n:z.indexOf(o),l&&!1!==(f=new l).init(o,p||i,t,c,z)&&(t._pt=s=new _e(t._pt,o,f.name,0,1,f.render,f,0,f.priority),f._props.forEach(function(t){d[t]=s}),f.priority&&(u=1)),!l||p)for(a in i)pt[a]&&(f=ac(a,i,t,c,o,z))?f.priority&&(u=1):d[a]=s=Wt.call(t,o,a,"get",i[a],c,z,0,m.stringFilter);t._op&&t._op[n]&&t.kill(o,t._op[n]),E&&t._pt&&(Nt=t,I.killTweensOf(o,d,t.globalTime(e)),_=!t.parent,Nt=0),t._pt&&T&&(ct[h.id]=1)}u&&pe(t),t._onInit&&t._onInit(t)}t._onUpdate=b,t._initted=(!t._op||t._pt)&&!_,k&&e<=0&&D.render(U,!0,!0)},Kt=function _parseFuncOrString(t,e,i,n,a){return s(t)?t.call(e,i,n,a):r(t)&&~t.indexOf("random(")?ob(t):t},Jt=vt+"repeat,repeatDelay,yoyo,repeatRefresh,yoyoEase,autoRevert",Ht={};ha(Jt+",id,stagger,delay,duration,paused,scrollTrigger",function(t){return Ht[t]=1});var $t=function(D){function Tween(e,r,i,n){var a;"number"==typeof r&&(i.duration=r,r=i,i=null);var s,o,u,h,l,f,d,c,p=(a=D.call(this,n?r:va(r))||this).vars,_=p.duration,m=p.delay,g=p.immediateRender,T=p.stagger,b=p.overwrite,x=p.keyframes,O=p.defaults,k=p.scrollTrigger,M=p.yoyoEase,P=r.parent||I,C=(Z(e)||$(e)?t(e[0]):"length"in r)?[e]:Mt(e);if(a._targets=C.length?ea(C):R("GSAP target "+e+" not found. https://gsap.com",!q.nullTargetWarn)||[],a._ptLookup=[],a._overwrite=b,x||T||y(_)||y(m)){if(r=a.vars,(s=a.timeline=new Xt({data:"nested",defaults:O||{},targets:P&&"nested"===P.data?P.vars.targets:C})).kill(),s.parent=s._dp=_assertThisInitialized(a),s._start=0,T||y(_)||y(m)){if(h=C.length,d=T&&eb(T),v(T))for(l in T)~Jt.indexOf(l)&&((c=c||{})[l]=T[l]);for(o=0;o<h;o++)(u=ua(r,Ht)).stagger=0,M&&(u.yoyoEase=M),c&&yt(u,c),f=C[o],u.duration=+Kt(_,_assertThisInitialized(a),o,f,C),u.delay=(+Kt(m,_assertThisInitialized(a),o,f,C)||0)-a._delay,!T&&1===h&&u.delay&&(a._delay=m=u.delay,a._start+=m,u.delay=0),s.to(f,u,d?d(o,f,C):0),s._ease=Lt.none;s.duration()?_=m=0:a.timeline=0}else if(x){va(qa(s.vars.defaults,{ease:"none"})),s._ease=jt(x.ease||r.ease||"none");var A,S,z,E=0;if(Z(x))x.forEach(function(t){return s.to(C,t,">")}),s.duration();else{for(l in u={},x)"ease"===l||"easeEach"===l||gc(l,x[l],u,x.easeEach);for(l in u)for(A=u[l].sort(function(t,e){return t.t-e.t}),o=E=0;o<A.length;o++)(z={ease:(S=A[o]).e,duration:(S.t-(o?A[o-1].t:0))/100*_})[l]=S.v,s.to(C,z,E),E+=z.duration;s.duration()<_&&s.to({},{duration:_-s.duration()})}}_||a.duration(_=s.duration())}else a.timeline=0;return!0!==b||F||(Nt=_assertThisInitialized(a),I.killTweensOf(C),Nt=0),Ka(P,_assertThisInitialized(a),i),r.reversed&&a.reverse(),r.paused&&a.paused(!0),(g||!_&&!x&&a._start===ja(P._time)&&w(g)&&function _hasNoPausedAncestors(t){return!t||t._ts&&_hasNoPausedAncestors(t.parent)}(_assertThisInitialized(a))&&"nested"!==P.data)&&(a._tTime=-X,a.render(Math.max(0,-m)||0)),k&&La(_assertThisInitialized(a),k),a}_inheritsLoose(Tween,D);var e=Tween.prototype;return e.render=function render(t,e,r){var i,n,a,s,o,u,h,l,f,d=this._time,c=this._tDur,p=this._dur,_=t<0,m=c-X<t&&!_?c:t<X?0:t;if(p){if(m!==this._tTime||!t||r||!this._initted&&this._tTime||this._startAt&&this._zTime<0!=_){if(i=m,l=this.timeline,this._repeat){if(s=p+this._rDelay,this._repeat<-1&&_)return this.totalTime(100*s+t,e,r);if(i=ja(m%s),m===c?(a=this._repeat,i=p):((a=~~(m/s))&&a===ja(m/s)&&(i=p,a--),p<i&&(i=p)),(u=this._yoyo&&1&a)&&(f=this._yEase,i=p-i),o=Tt(this._tTime,s),i===d&&!r&&this._initted&&a===o)return this._tTime=m,this;a!==o&&(l&&this._yEase&&Qb(l,u),this.vars.repeatRefresh&&!u&&!this._lock&&this._time!==s&&this._initted&&(this._lock=r=1,this.render(ja(s*a),!0).invalidate()._lock=0))}if(!this._initted){if(Ma(this,_?t:i,r,e,m))return this._tTime=0,this;if(!(d===this._time||r&&this.vars.repeatRefresh&&a!==o))return this;if(p!==this._dur)return this.render(t,e,r)}if(this._tTime=m,this._time=i,!this._act&&this._ts&&(this._act=1,this._lazy=0),this.ratio=h=(f||this._ease)(i/p),this._from&&(this.ratio=h=1-h),i&&!d&&!e&&!a&&(Ct(this,"onStart"),this._tTime!==m))return this;for(n=this._pt;n;)n.r(h,n.d),n=n._next;l&&l.render(t<0?t:l._dur*l._ease(i/this._dur),e,r)||this._startAt&&(this._zTime=t),this._onUpdate&&!e&&(_&&Ca(this,t,0,r),Ct(this,"onUpdate")),this._repeat&&a!==o&&this.vars.onRepeat&&!e&&this.parent&&Ct(this,"onRepeat"),m!==this._tDur&&m||this._tTime!==m||(_&&!this._onUpdate&&Ca(this,t,0,!0),!t&&p||!(m===this._tDur&&0<this._ts||!m&&this._ts<0)||za(this,1),e||_&&!d||!(m||d||u)||(Ct(this,m===c?"onComplete":"onReverseComplete",!0),!this._prom||m<c&&0<this.timeScale()||this._prom()))}}else!function _renderZeroDurationTween(t,e,r,i){var n,a,s,o=t.ratio,u=e<0||!e&&(!t._start&&function _parentPlayheadIsBeforeStart(t){var e=t.parent;return e&&e._ts&&e._initted&&!e._lock&&(e.rawTime()<0||_parentPlayheadIsBeforeStart(e))}(t)&&(t._initted||!bt(t))||(t._ts<0||t._dp._ts<0)&&!bt(t))?0:1,h=t._rDelay,l=0;if(h&&t._repeat&&(l=Ot(0,t._tDur,e),a=Tt(l,h),t._yoyo&&1&a&&(u=1-u),a!==Tt(t._tTime,h)&&(o=1-u,t.vars.repeatRefresh&&t._initted&&t.invalidate())),u!==o||L||i||t._zTime===X||!e&&t._zTime){if(!t._initted&&Ma(t,e,i,r,l))return;for(s=t._zTime,t._zTime=e||(r?X:0),r=r||e&&!s,t.ratio=u,t._from&&(u=1-u),t._time=0,t._tTime=l,n=t._pt;n;)n.r(u,n.d),n=n._next;e<0&&Ca(t,e,0,!0),t._onUpdate&&!r&&Ct(t,"onUpdate"),l&&t._repeat&&!r&&t.parent&&Ct(t,"onRepeat"),(e>=t._tDur||e<0)&&t.ratio===u&&(u&&za(t,1),r||L||(Ct(t,u?"onComplete":"onReverseComplete",!0),t._prom&&t._prom()))}else t._zTime||(t._zTime=e)}(this,t,e,r);return this},e.targets=function targets(){return this._targets},e.invalidate=function invalidate(t){return t&&this.vars.runBackwards||(this._startAt=0),this._pt=this._op=this._onUpdate=this._lazy=this.ratio=0,this._ptLookup=[],this.timeline&&this.timeline.invalidate(t),D.prototype.invalidate.call(this,t)},e.resetTo=function resetTo(t,e,r,i,n){c||Rt.wake(),this._ts||this.play();var a,s=Math.min(this._dur,(this._dp._time-this._start)*this._ts);return this._initted||Qt(this,s),a=this._ease(s/this._dur),function _updatePropTweens(t,e,r,i,n,a,s,o){var u,h,l,f,d=(t._pt&&t._ptCache||(t._ptCache={}))[e];if(!d)for(d=t._ptCache[e]=[],l=t._ptLookup,f=t._targets.length;f--;){if((u=l[f][e])&&u.d&&u.d._pt)for(u=u.d._pt;u&&u.p!==e&&u.fp!==e;)u=u._next;if(!u)return Gt=1,t.vars[e]="+=0",Qt(t,s),Gt=0,o?R(e+" not eligible for reset"):1;d.push(u)}for(f=d.length;f--;)(u=(h=d[f])._pt||h).s=!i&&0!==i||n?u.s+(i||0)+a*u.c:i,u.c=r-u.s,h.e&&(h.e=ia(r)+Ya(h.e)),h.b&&(h.b=u.s+Ya(h.b))}(this,t,e,r,i,a,s,n)?this.resetTo(t,e,r,i,1):(Ia(this,0),this.parent||xa(this._dp,this,"_first","_last",this._dp._sort?"_start":0),this.render(0))},e.kill=function kill(t,e){if(void 0===e&&(e="all"),!(t||e&&"all"!==e))return this._lazy=this._pt=0,this.parent?tb(this):this;if(this.timeline){var i=this.timeline.totalDuration();return this.timeline.killTweensOf(t,e,Nt&&!0!==Nt.vars.overwrite)._first||tb(this),this.parent&&i!==this.timeline.totalDuration()&&Ra(this,this._dur*this.timeline._tDur/i,0,1),this}var n,a,s,o,u,h,l,f=this._targets,d=t?Mt(t):f,c=this._ptLookup,p=this._pt;if((!e||"all"===e)&&function _arraysMatch(t,e){for(var r=t.length,i=r===e.length;i&&r--&&t[r]===e[r];);return r<0}(f,d))return"all"===e&&(this._pt=0),tb(this);for(n=this._op=this._op||[],"all"!==e&&(r(e)&&(u={},ha(e,function(t){return u[t]=1}),e=u),e=function _addAliasesToVars(t,e){var r,i,n,a,s=t[0]?fa(t[0]).harness:0,o=s&&s.aliases;if(!o)return e;for(i in r=yt({},e),o)if(i in r)for(n=(a=o[i].split(",")).length;n--;)r[a[n]]=r[i];return r}(f,e)),l=f.length;l--;)if(~d.indexOf(f[l]))for(u in a=c[l],"all"===e?(n[l]=e,o=a,s={}):(s=n[l]=n[l]||{},o=e),o)(h=a&&a[u])&&("kill"in h.d&&!0!==h.d.kill(u)||ya(this,h,"_pt"),delete a[u]),"all"!==s&&(s[u]=1);return this._initted&&!this._pt&&p&&tb(this),this},Tween.to=function to(t,e,r){return new Tween(t,e,r)},Tween.from=function from(t,e){return Va(1,arguments)},Tween.delayedCall=function delayedCall(t,e,r,i){return new Tween(e,0,{immediateRender:!1,lazy:!1,overwrite:!1,delay:t,onComplete:e,onReverseComplete:e,onCompleteParams:r,onReverseCompleteParams:r,callbackScope:i})},Tween.fromTo=function fromTo(t,e,r){return Va(2,arguments)},Tween.set=function set(t,e){return e.duration=0,e.repeatDelay||(e.repeat=0),new Tween(t,e)},Tween.killTweensOf=function killTweensOf(t,e,r){return I.killTweensOf(t,e,r)},Tween}(Ut);qa($t.prototype,{_targets:[],_lazy:0,_startAt:0,_op:0,_onInit:0}),ha("staggerTo,staggerFrom,staggerFromTo",function(r){$t[r]=function(){var t=new Xt,e=kt.call(arguments,0);return e.splice("staggerFromTo"===r?5:4,0,0),t[r].apply(t,e)}});function oc(t,e,r){return t.setAttribute(e,r)}function wc(t,e,r,i){i.mSet(t,e,i.m.call(i.tween,r,i.mt),i)}var Zt=function _setterPlain(t,e,r){return t[e]=r},te=function _setterFunc(t,e,r){return t[e](r)},re=function _setterFuncWithParam(t,e,r,i){return t[e](i.fp,r)},ne=function _getSetter(t,e){return s(t[e])?te:u(t[e])&&t.setAttribute?oc:Zt},ae=function _renderPlain(t,e){return e.set(e.t,e.p,Math.round(1e6*(e.s+e.c*t))/1e6,e)},se=function _renderBoolean(t,e){return e.set(e.t,e.p,!!(e.s+e.c*t),e)},ue=function _renderComplexString(t,e){var r=e._pt,i="";if(!t&&e.b)i=e.b;else if(1===t&&e.e)i=e.e;else{for(;r;)i=r.p+(r.m?r.m(r.s+r.c*t):Math.round(1e4*(r.s+r.c*t))/1e4)+i,r=r._next;i+=e.c}e.set(e.t,e.p,i,e)},he=function _renderPropTweens(t,e){for(var r=e._pt;r;)r.r(t,r.d),r=r._next},fe=function _addPluginModifier(t,e,r,i){for(var n,a=this._pt;a;)n=a._next,a.p===i&&a.modifier(t,e,r),a=n},ce=function _killPropTweensOf(t){for(var e,r,i=this._pt;i;)r=i._next,i.p===t&&!i.op||i.op===t?ya(this,i,"_pt"):i.dep||(e=1),i=r;return!e},pe=function _sortPropTweensByPriority(t){for(var e,r,i,n,a=t._pt;a;){for(e=a._next,r=i;r&&r.pr>a.pr;)r=r._next;(a._prev=r?r._prev:n)?a._prev._next=a:i=a,(a._next=r)?r._prev=a:n=a,a=e}t._pt=i},_e=(PropTween.prototype.modifier=function modifier(t,e,r){this.mSet=this.mSet||this.set,this.set=wc,this.m=t,this.mt=r,this.tween=e},PropTween);function PropTween(t,e,r,i,n,a,s,o,u){this.t=e,this.s=i,this.c=n,this.p=r,this.r=a||ae,this.d=s||this,this.set=o||Zt,this.pr=u||0,(this._next=t)&&(t._prev=this)}ha(vt+"parent,duration,ease,delay,overwrite,runBackwards,startAt,yoyo,immediateRender,repeat,repeatDelay,data,paused,reversed,lazy,callbackScope,stringFilter,id,yoyoEase,stagger,inherit,repeatRefresh,keyframes,autoRevert,scrollTrigger",function(t){return ft[t]=1}),ot.TweenMax=ot.TweenLite=$t,ot.TimelineLite=ot.TimelineMax=Xt,I=new Xt({sortChildren:!1,defaults:V,autoRemoveChildren:!0,id:"root",smoothChildTiming:!0}),q.stringFilter=Fb;function Ec(t){return(ye[t]||Te).map(function(t){return t()})}function Fc(){var t=Date.now(),o=[];2<t-Oe&&(Ec("matchMediaInit"),ge.forEach(function(t){var e,r,i,n,a=t.queries,s=t.conditions;for(r in a)(e=h.matchMedia(a[r]).matches)&&(i=1),e!==s[r]&&(s[r]=e,n=1);n&&(t.revert(),i&&o.push(t))}),Ec("matchMediaRevert"),o.forEach(function(e){return e.onMatch(e,function(t){return e.add(null,t)})}),Oe=t,Ec("matchMedia"))}var me,ge=[],ye={},Te=[],Oe=0,Me=0,Pe=((me=Context.prototype).add=function add(t,i,n){function Gw(){var t,e=l,r=a.selector;return e&&e!==a&&e.data.push(a),n&&(a.selector=cb(n)),l=a,t=i.apply(a,arguments),s(t)&&a._r.push(t),l=e,a.selector=r,a.isReverted=!1,t}s(t)&&(n=i,i=t,t=s);var a=this;return a.last=Gw,t===s?Gw(a,function(t){return a.add(null,t)}):t?a[t]=Gw:Gw},me.ignore=function ignore(t){var e=l;l=null,t(this),l=e},me.getTweens=function getTweens(){var e=[];return this.data.forEach(function(t){return t instanceof Context?e.push.apply(e,t.getTweens()):t instanceof $t&&!(t.parent&&"nested"===t.parent.data)&&e.push(t)}),e},me.clear=function clear(){this._r.length=this.data.length=0},me.kill=function kill(i,t){var n=this;if(i?function(){for(var t,e=n.getTweens(),r=n.data.length;r--;)"isFlip"===(t=n.data[r]).data&&(t.revert(),t.getChildren(!0,!0,!1).forEach(function(t){return e.splice(e.indexOf(t),1)}));for(e.map(function(t){return{g:t._dur||t._delay||t._sat&&!t._sat.vars.immediateRender?t.globalTime(0):-1/0,t:t}}).sort(function(t,e){return e.g-t.g||-1/0}).forEach(function(t){return t.t.revert(i)}),r=n.data.length;r--;)(t=n.data[r])instanceof Xt?"nested"!==t.data&&(t.scrollTrigger&&t.scrollTrigger.revert(),t.kill()):t instanceof $t||!t.revert||t.revert(i);n._r.forEach(function(t){return t(i,n)}),n.isReverted=!0}():this.data.forEach(function(t){return t.kill&&t.kill()}),this.clear(),t)for(var e=ge.length;e--;)ge[e].id===this.id&&ge.splice(e,1)},me.revert=function revert(t){this.kill(t||{})},Context);function Context(t,e){this.selector=e&&cb(e),this.data=[],this._r=[],this.isReverted=!1,this.id=Me++,t&&this.add(t)}var Ce,Ae=((Ce=MatchMedia.prototype).add=function add(t,e,r){v(t)||(t={matches:t});var i,n,a,s=new Pe(0,r||this.scope),o=s.conditions={};for(n in l&&!s.selector&&(s.selector=l.selector),this.contexts.push(s),e=s.add("onMatch",e),s.queries=t)"all"===n?a=1:(i=h.matchMedia(t[n]))&&(ge.indexOf(s)<0&&ge.push(s),(o[n]=i.matches)&&(a=1),i.addListener?i.addListener(Fc):i.addEventListener("change",Fc));return a&&e(s,function(t){return s.add(null,t)}),this},Ce.revert=function revert(t){this.kill(t||{})},Ce.kill=function kill(e){this.contexts.forEach(function(t){return t.kill(e,!0)})},MatchMedia);function MatchMedia(t){this.contexts=[],this.scope=t,l&&l.data.push(this)}var Se={registerPlugin:function registerPlugin(){for(var t=arguments.length,e=new Array(t),r=0;r<t;r++)e[r]=arguments[r];e.forEach(function(t){return wb(t)})},timeline:function timeline(t){return new Xt(t)},getTweensOf:function getTweensOf(t,e){return I.getTweensOf(t,e)},getProperty:function getProperty(i,t,e,n){r(i)&&(i=Mt(i)[0]);var a=fa(i||{}).get,s=e?pa:oa;return"native"===e&&(e=""),i?t?s((pt[t]&&pt[t].get||a)(i,t,e,n)):function(t,e,r){return s((pt[t]&&pt[t].get||a)(i,t,e,r))}:i},quickSetter:function quickSetter(r,e,i){if(1<(r=Mt(r)).length){var n=r.map(function(t){return ze.quickSetter(t,e,i)}),a=n.length;return function(t){for(var e=a;e--;)n[e](t)}}r=r[0]||{};var s=pt[e],o=fa(r),u=o.harness&&(o.harness.aliases||{})[e]||e,h=s?function(t){var e=new s;d._pt=0,e.init(r,i?t+i:t,d,0,[r]),e.render(1,e),d._pt&&he(1,d)}:o.set(r,u);return s?h:function(t){return h(r,u,i?t+i:t,o,1)}},quickTo:function quickTo(t,i,e){function $x(t,e,r){return n.resetTo(i,t,e,r)}var r,n=ze.to(t,yt(((r={})[i]="+=0.1",r.paused=!0,r),e||{}));return $x.tween=n,$x},isTweening:function isTweening(t){return 0<I.getTweensOf(t,!0).length},defaults:function defaults(t){return t&&t.ease&&(t.ease=jt(t.ease,V.ease)),ta(V,t||{})},config:function config(t){return ta(q,t||{})},registerEffect:function registerEffect(t){var i=t.name,n=t.effect,e=t.plugins,a=t.defaults,r=t.extendTimeline;(e||"").split(",").forEach(function(t){return t&&!pt[t]&&!ot[t]&&R(i+" effect requires "+t+" plugin.")}),_t[i]=function(t,e,r){return n(Mt(t),qa(e||{},a),r)},r&&(Xt.prototype[i]=function(t,e,r){return this.add(_t[i](t,v(e)?e:(r=e)&&{},this),r)})},registerEase:function registerEase(t,e){Lt[t]=jt(e)},parseEase:function parseEase(t,e){return arguments.length?jt(t,e):Lt},getById:function getById(t){return I.getById(t)},exportRoot:function exportRoot(t,e){void 0===t&&(t={});var r,i,n=new Xt(t);for(n.smoothChildTiming=w(t.smoothChildTiming),I.remove(n),n._dp=0,n._time=n._tTime=I._time,r=I._first;r;)i=r._next,!e&&!r._dur&&r instanceof $t&&r.vars.onComplete===r._targets[0]||Ka(n,r,r._start-r._delay),r=i;return Ka(I,n,0),n},context:function context(t,e){return t?new Pe(t,e):l},matchMedia:function matchMedia(t){return new Ae(t)},matchMediaRefresh:function matchMediaRefresh(){return ge.forEach(function(t){var e,r,i=t.conditions;for(r in i)i[r]&&(i[r]=!1,e=1);e&&t.revert()})||Fc()},addEventListener:function addEventListener(t,e){var r=ye[t]||(ye[t]=[]);~r.indexOf(e)||r.push(e)},removeEventListener:function removeEventListener(t,e){var r=ye[t],i=r&&r.indexOf(e);0<=i&&r.splice(i,1)},utils:{wrap:function wrap(e,t,r){var i=t-e;return Z(e)?lb(e,wrap(0,e.length),t):Wa(r,function(t){return(i+(t-e)%i)%i+e})},wrapYoyo:function wrapYoyo(e,t,r){var i=t-e,n=2*i;return Z(e)?lb(e,wrapYoyo(0,e.length-1),t):Wa(r,function(t){return e+(i<(t=(n+(t-e)%n)%n||0)?n-t:t)})},distribute:eb,random:hb,snap:gb,normalize:function normalize(t,e,r){return Pt(t,e,0,1,r)},getUnit:Ya,clamp:function clamp(e,r,t){return Wa(t,function(t){return Ot(e,r,t)})},splitColor:Ab,toArray:Mt,selector:cb,mapRange:Pt,pipe:function pipe(){for(var t=arguments.length,e=new Array(t),r=0;r<t;r++)e[r]=arguments[r];return function(t){return e.reduce(function(t,e){return e(t)},t)}},unitize:function unitize(e,r){return function(t){return e(parseFloat(t))+(r||Ya(t))}},interpolate:function interpolate(e,i,t,n){var a=isNaN(e+i)?0:function(t){return(1-t)*e+t*i};if(!a){var s,o,u,h,l,f=r(e),d={};if(!0===t&&(n=1)&&(t=null),f)e={p:e},i={p:i};else if(Z(e)&&!Z(i)){for(u=[],h=e.length,l=h-2,o=1;o<h;o++)u.push(interpolate(e[o-1],e[o]));h--,a=function func(t){t*=h;var e=Math.min(l,~~t);return u[e](t-e)},t=i}else n||(e=yt(Z(e)?[]:{},e));if(!u){for(s in i)Wt.call(d,e,s,"get",i[s]);a=function func(t){return he(t,d)||(f?e.p:e)}}}return Wa(t,a)},shuffle:db},install:P,effects:_t,ticker:Rt,updateRoot:Xt.updateRoot,plugins:pt,globalTimeline:I,core:{PropTween:_e,globals:S,Tween:$t,Timeline:Xt,Animation:Ut,getCache:fa,_removeLinkedListItem:ya,reverting:function reverting(){return L},context:function context(t){return t&&l&&(l.data.push(t),t._ctx=l),l},suppressOverwrites:function suppressOverwrites(t){return F=t}}};ha("to,from,fromTo,delayedCall,set,killTweensOf",function(t){return Se[t]=$t[t]}),Rt.add(Xt.updateRoot),d=Se.to({},{duration:0});function Jc(t,e){for(var r=t._pt;r&&r.p!==e&&r.op!==e&&r.fp!==e;)r=r._next;return r}function Lc(t,a){return{name:t,rawVars:1,init:function init(t,n,e){e._onInit=function(t){var e,i;if(r(n)&&(e={},ha(n,function(t){return e[t]=1}),n=e),a){for(i in e={},n)e[i]=a(n[i]);n=e}!function _addModifiers(t,e){var r,i,n,a=t._targets;for(r in e)for(i=a.length;i--;)(n=(n=t._ptLookup[i][r])&&n.d)&&(n._pt&&(n=Jc(n,r)),n&&n.modifier&&n.modifier(e[r],t,a[i],r))}(t,n)}}}}var ze=Se.registerPlugin({name:"attr",init:function init(t,e,r,i,n){var a,s,o;for(a in this.tween=r,e)o=t.getAttribute(a)||"",(s=this.add(t,"setAttribute",(o||0)+"",e[a],i,n,0,0,a)).op=a,s.b=o,this._props.push(a)},render:function render(t,e){for(var r=e._pt;r;)L?r.set(r.t,r.p,r.b,r):r.r(t,r.d),r=r._next}},{name:"endArray",init:function init(t,e){for(var r=e.length;r--;)this.add(t,r,t[r]||0,e[r],0,0,0,0,0,1)}},Lc("roundProps",fb),Lc("modifiers"),Lc("snap",gb))||Se;$t.version=Xt.version=ze.version="3.12.5",o=1,x()&&Ft();function vd(t,e){return e.set(e.t,e.p,Math.round(1e4*(e.s+e.c*t))/1e4+e.u,e)}function wd(t,e){return e.set(e.t,e.p,1===t?e.e:Math.round(1e4*(e.s+e.c*t))/1e4+e.u,e)}function xd(t,e){return e.set(e.t,e.p,t?Math.round(1e4*(e.s+e.c*t))/1e4+e.u:e.b,e)}function yd(t,e){var r=e.s+e.c*t;e.set(e.t,e.p,~~(r+(r<0?-.5:.5))+e.u,e)}function zd(t,e){return e.set(e.t,e.p,t?e.e:e.b,e)}function Ad(t,e){return e.set(e.t,e.p,1!==t?e.b:e.e,e)}function Bd(t,e,r){return t.style[e]=r}function Cd(t,e,r){return t.style.setProperty(e,r)}function Dd(t,e,r){return t._gsap[e]=r}function Ed(t,e,r){return t._gsap.scaleX=t._gsap.scaleY=r}function Fd(t,e,r,i,n){var a=t._gsap;a.scaleX=a.scaleY=r,a.renderTransform(n,a)}function Gd(t,e,r,i,n){var a=t._gsap;a[e]=r,a.renderTransform(n,a)}function Jd(t,e){var r=this,i=this.target,n=i.style,a=i._gsap;if(t in ar&&n){if(this.tfm=this.tfm||{},"transform"===t)return dr.transform.split(",").forEach(function(t){return Jd.call(r,t,e)});if(~(t=dr[t]||t).indexOf(",")?t.split(",").forEach(function(t){return r.tfm[t]=yr(i,t)}):this.tfm[t]=a.x?a[t]:yr(i,t),t===pr&&(this.tfm.zOrigin=a.zOrigin),0<=this.props.indexOf(cr))return;a.svg&&(this.svgo=i.getAttribute("data-svg-origin"),this.props.push(pr,e,"")),t=cr}(n||e)&&this.props.push(t,e,n[t])}function Kd(t){t.translate&&(t.removeProperty("translate"),t.removeProperty("scale"),t.removeProperty("rotate"))}function Ld(){var t,e,r=this.props,i=this.target,n=i.style,a=i._gsap;for(t=0;t<r.length;t+=3)r[t+1]?i[r[t]]=r[t+2]:r[t+2]?n[r[t]]=r[t+2]:n.removeProperty("--"===r[t].substr(0,2)?r[t]:r[t].replace(hr,"-$1").toLowerCase());if(this.tfm){for(e in this.tfm)a[e]=this.tfm[e];a.svg&&(a.renderTransform(),i.setAttribute("data-svg-origin",this.svgo||"")),(t=Be())&&t.isStart||n[cr]||(Kd(n),a.zOrigin&&n[pr]&&(n[pr]+=" "+a.zOrigin+"px",a.zOrigin=0,a.renderTransform()),a.uncache=1)}}function Md(t,e){var r={target:t,props:[],revert:Ld,save:Jd};return t._gsap||ze.core.getCache(t),e&&e.split(",").forEach(function(t){return r.save(t)}),r}function Od(t,e){var r=De.createElementNS?De.createElementNS((e||"http://www.w3.org/1999/xhtml").replace(/^https/,"http"),t):De.createElement(t);return r&&r.style?r:De.createElement(t)}function Pd(t,e,r){var i=getComputedStyle(t);return i[e]||i.getPropertyValue(e.replace(hr,"-$1").toLowerCase())||i.getPropertyValue(e)||!r&&Pd(t,mr(e)||e,1)||""}function Sd(){(function _windowExists(){return"undefined"!=typeof window})()&&window.document&&(Ee=window,De=Ee.document,Re=De.documentElement,Le=Od("div")||{style:{}},Od("div"),cr=mr(cr),pr=cr+"Origin",Le.style.cssText="border-width:0;line-height:0;position:absolute;padding:0",Ye=!!mr("perspective"),Be=ze.core.reverting,Fe=1)}function Td(t){var e,r=Od("svg",this.ownerSVGElement&&this.ownerSVGElement.getAttribute("xmlns")||"http://www.w3.org/2000/svg"),i=this.parentNode,n=this.nextSibling,a=this.style.cssText;if(Re.appendChild(r),r.appendChild(this),this.style.display="block",t)try{e=this.getBBox(),this._gsapBBox=this.getBBox,this.getBBox=Td}catch(t){}else this._gsapBBox&&(e=this._gsapBBox());return i&&(n?i.insertBefore(this,n):i.appendChild(this)),Re.removeChild(r),this.style.cssText=a,e}function Ud(t,e){for(var r=e.length;r--;)if(t.hasAttribute(e[r]))return t.getAttribute(e[r])}function Vd(e){var r;try{r=e.getBBox()}catch(t){r=Td.call(e,!0)}return r&&(r.width||r.height)||e.getBBox===Td||(r=Td.call(e,!0)),!r||r.width||r.x||r.y?r:{x:+Ud(e,["x","cx","x1"])||0,y:+Ud(e,["y","cy","y1"])||0,width:0,height:0}}function Wd(t){return!(!t.getCTM||t.parentNode&&!t.ownerSVGElement||!Vd(t))}function Xd(t,e){if(e){var r,i=t.style;e in ar&&e!==pr&&(e=cr),i.removeProperty?("ms"!==(r=e.substr(0,2))&&"webkit"!==e.substr(0,6)||(e="-"+e),i.removeProperty("--"===r?e:e.replace(hr,"-$1").toLowerCase())):i.removeAttribute(e)}}function Yd(t,e,r,i,n,a){var s=new _e(t._pt,e,r,0,1,a?Ad:zd);return(t._pt=s).b=i,s.e=n,t._props.push(r),s}function _d(t,e,r,i){var n,a,s,o,u=parseFloat(r)||0,h=(r+"").trim().substr((u+"").length)||"px",l=Le.style,f=lr.test(e),d="svg"===t.tagName.toLowerCase(),c=(d?"client":"offset")+(f?"Width":"Height"),p="px"===i,_="%"===i;if(i===h||!u||gr[i]||gr[h])return u;if("px"===h||p||(u=_d(t,e,r,"px")),o=t.getCTM&&Wd(t),(_||"%"===h)&&(ar[e]||~e.indexOf("adius")))return n=o?t.getBBox()[f?"width":"height"]:t[c],ia(_?u/n*100:u/100*n);if(l[f?"width":"height"]=100+(p?h:i),a=~e.indexOf("adius")||"em"===i&&t.appendChild&&!d?t:t.parentNode,o&&(a=(t.ownerSVGElement||{}).parentNode),a&&a!==De&&a.appendChild||(a=De.body),(s=a._gsap)&&_&&s.width&&f&&s.time===Rt.time&&!s.uncache)return ia(u/s.width*100);if(!_||"height"!==e&&"width"!==e)!_&&"%"!==h||vr[Pd(a,"display")]||(l.position=Pd(t,"position")),a===t&&(l.position="static"),a.appendChild(Le),n=Le[c],a.removeChild(Le),l.position="absolute";else{var m=t.style[e];t.style[e]=100+i,n=t[c],m?t.style[e]=m:Xd(t,e)}return f&&_&&((s=fa(a)).time=Rt.time,s.width=a[c]),ia(p?n*u/100:n&&u?100/n*u:0)}function be(t,e,r,i){if(!r||"none"===r){var n=mr(e,t,1),a=n&&Pd(t,n,1);a&&a!==r?(e=n,r=a):"borderColor"===e&&(r=Pd(t,"borderTopColor"))}var s,o,u,h,l,f,d,c,p,_,m,g=new _e(this._pt,t.style,e,0,1,ue),v=0,y=0;if(g.b=r,g.e=i,r+="","auto"===(i+="")&&(f=t.style[e],t.style[e]=i,i=Pd(t,e)||i,f?t.style[e]=f:Xd(t,e)),Fb(s=[r,i]),i=s[1],u=(r=s[0]).match(rt)||[],(i.match(rt)||[]).length){for(;o=rt.exec(i);)d=o[0],p=i.substring(v,o.index),l?l=(l+1)%5:"rgba("!==p.substr(-5)&&"hsla("!==p.substr(-5)||(l=1),d!==(f=u[y++]||"")&&(h=parseFloat(f)||0,m=f.substr((h+"").length),"="===d.charAt(1)&&(d=ka(h,d)+m),c=parseFloat(d),_=d.substr((c+"").length),v=rt.lastIndex-_.length,_||(_=_||q.units[e]||m,v===i.length&&(i+=_,g.e+=_)),m!==_&&(h=_d(t,e,f,_)||0),g._pt={_next:g._pt,p:p||1===y?p:",",s:h,c:c-h,m:l&&l<4||"zIndex"===e?Math.round:0});g.c=v<i.length?i.substring(v,i.length):""}else g.r="display"===e&&"none"===i?Ad:zd;return nt.test(i)&&(g.e=0),this._pt=g}function de(t){var e=t.split(" "),r=e[0],i=e[1]||"50%";return"top"!==r&&"bottom"!==r&&"left"!==i&&"right"!==i||(t=r,r=i,i=t),e[0]=Tr[r]||r,e[1]=Tr[i]||i,e.join(" ")}function ee(t,e){if(e.tween&&e.tween._time===e.tween._dur){var r,i,n,a=e.t,s=a.style,o=e.u,u=a._gsap;if("all"===o||!0===o)s.cssText="",i=1;else for(n=(o=o.split(",")).length;-1<--n;)r=o[n],ar[r]&&(i=1,r="transformOrigin"===r?pr:cr),Xd(a,r);i&&(Xd(a,cr),u&&(u.svg&&a.removeAttribute("transform"),Or(a,1),u.uncache=1,Kd(s)))}}function ie(t){return"matrix(1, 0, 0, 1, 0, 0)"===t||"none"===t||!t}function je(t){var e=Pd(t,cr);return ie(e)?wr:e.substr(7).match(et).map(ia)}function ke(t,e){var r,i,n,a,s=t._gsap||fa(t),o=t.style,u=je(t);return s.svg&&t.getAttribute("transform")?"1,0,0,1,0,0"===(u=[(n=t.transform.baseVal.consolidate().matrix).a,n.b,n.c,n.d,n.e,n.f]).join(",")?wr:u:(u!==wr||t.offsetParent||t===Re||s.svg||(n=o.display,o.display="block",(r=t.parentNode)&&t.offsetParent||(a=1,i=t.nextElementSibling,Re.appendChild(t)),u=je(t),n?o.display=n:Xd(t,"display"),a&&(i?r.insertBefore(t,i):r?r.appendChild(t):Re.removeChild(t))),e&&6<u.length?[u[0],u[1],u[4],u[5],u[12],u[13]]:u)}function le(t,e,r,i,n,a){var s,o,u,h=t._gsap,l=n||ke(t,!0),f=h.xOrigin||0,d=h.yOrigin||0,c=h.xOffset||0,p=h.yOffset||0,_=l[0],m=l[1],g=l[2],v=l[3],y=l[4],T=l[5],b=e.split(" "),w=parseFloat(b[0])||0,x=parseFloat(b[1])||0;r?l!==wr&&(o=_*v-m*g)&&(u=w*(-m/o)+x*(_/o)-(_*T-m*y)/o,w=w*(v/o)+x*(-g/o)+(g*T-v*y)/o,x=u):(w=(s=Vd(t)).x+(~b[0].indexOf("%")?w/100*s.width:w),x=s.y+(~(b[1]||b[0]).indexOf("%")?x/100*s.height:x)),i||!1!==i&&h.smooth?(y=w-f,T=x-d,h.xOffset=c+(y*_+T*g)-y,h.yOffset=p+(y*m+T*v)-T):h.xOffset=h.yOffset=0,h.xOrigin=w,h.yOrigin=x,h.smooth=!!i,h.origin=e,h.originIsAbsolute=!!r,t.style[pr]="0px 0px",a&&(Yd(a,h,"xOrigin",f,w),Yd(a,h,"yOrigin",d,x),Yd(a,h,"xOffset",c,h.xOffset),Yd(a,h,"yOffset",p,h.yOffset)),t.setAttribute("data-svg-origin",w+" "+x)}function oe(t,e,r){var i=Ya(e);return ia(parseFloat(e)+parseFloat(_d(t,"x",r+"px",i)))+i}function ve(t,e,i,n,a){var s,o,u=360,h=r(a),l=parseFloat(a)*(h&&~a.indexOf("rad")?sr:1)-n,f=n+l+"deg";return h&&("short"===(s=a.split("_")[1])&&(l%=u)!==l%180&&(l+=l<0?u:-u),"cw"===s&&l<0?l=(l+36e9)%u-~~(l/u)*u:"ccw"===s&&0<l&&(l=(l-36e9)%u-~~(l/u)*u)),t._pt=o=new _e(t._pt,e,i,n,l,wd),o.e=f,o.u="deg",t._props.push(i),o}function we(t,e){for(var r in e)t[r]=e[r];return t}function xe(t,e,r){var i,n,a,s,o,u,h,l=we({},r._gsap),f=r.style;for(n in l.svg?(a=r.getAttribute("transform"),r.setAttribute("transform",""),f[cr]=e,i=Or(r,1),Xd(r,cr),r.setAttribute("transform",a)):(a=getComputedStyle(r)[cr],f[cr]=e,i=Or(r,1),f[cr]=a),ar)(a=l[n])!==(s=i[n])&&"perspective,force3D,transformOrigin,svgOrigin".indexOf(n)<0&&(o=Ya(a)!==(h=Ya(s))?_d(r,n,a,h):parseFloat(a),u=parseFloat(s),t._pt=new _e(t._pt,i,n,o,u-o,vd),t._pt.u=h||0,t._props.push(n));we(i,l)}var Ee,De,Re,Fe,Le,Ie,Be,Ye,qe=Lt.Power0,Ve=Lt.Power1,Ue=Lt.Power2,Xe=Lt.Power3,Ne=Lt.Power4,Ge=Lt.Linear,We=Lt.Quad,Qe=Lt.Cubic,Ke=Lt.Quart,Je=Lt.Quint,He=Lt.Strong,$e=Lt.Elastic,Ze=Lt.Back,tr=Lt.SteppedEase,er=Lt.Bounce,rr=Lt.Sine,ir=Lt.Expo,nr=Lt.Circ,ar={},sr=180/Math.PI,or=Math.PI/180,ur=Math.atan2,hr=/([A-Z])/g,lr=/(left|right|width|margin|padding|x)/i,fr=/[\s,\(]\S/,dr={autoAlpha:"opacity,visibility",scale:"scaleX,scaleY",alpha:"opacity"},cr="transform",pr=cr+"Origin",_r="O,Moz,ms,Ms,Webkit".split(","),mr=function _checkPropPrefix(t,e,r){var i=(e||Le).style,n=5;if(t in i&&!r)return t;for(t=t.charAt(0).toUpperCase()+t.substr(1);n--&&!(_r[n]+t in i););return n<0?null:(3===n?"ms":0<=n?_r[n]:"")+t},gr={deg:1,rad:1,turn:1},vr={grid:1,flex:1},yr=function _get(t,e,r,i){var n;return Fe||Sd(),e in dr&&"transform"!==e&&~(e=dr[e]).indexOf(",")&&(e=e.split(",")[0]),ar[e]&&"transform"!==e?(n=Or(t,i),n="transformOrigin"!==e?n[e]:n.svg?n.origin:kr(Pd(t,pr))+" "+n.zOrigin+"px"):(n=t.style[e])&&"auto"!==n&&!i&&!~(n+"").indexOf("calc(")||(n=br[e]&&br[e](t,e,r)||Pd(t,e)||ga(t,e)||("opacity"===e?1:0)),r&&!~(n+"").trim().indexOf(" ")?_d(t,e,n,r)+r:n},Tr={top:"0%",bottom:"100%",left:"0%",right:"100%",center:"50%"},br={clearProps:function clearProps(t,e,r,i,n){if("isFromStart"!==n.data){var a=t._pt=new _e(t._pt,e,r,0,0,ee);return a.u=i,a.pr=-10,a.tween=n,t._props.push(r),1}}},wr=[1,0,0,1,0,0],xr={},Or=function _parseTransform(t,e){var r=t._gsap||new Vt(t);if("x"in r&&!e&&!r.uncache)return r;var i,n,a,s,o,u,h,l,f,d,c,p,_,m,g,v,y,T,b,w,x,O,k,M,P,C,A,S,z,E,D,R,F=t.style,L=r.scaleX<0,I="deg",B=getComputedStyle(t),Y=Pd(t,pr)||"0";return i=n=a=u=h=l=f=d=c=0,s=o=1,r.svg=!(!t.getCTM||!Wd(t)),B.translate&&("none"===B.translate&&"none"===B.scale&&"none"===B.rotate||(F[cr]=("none"!==B.translate?"translate3d("+(B.translate+" 0 0").split(" ").slice(0,3).join(", ")+") ":"")+("none"!==B.rotate?"rotate("+B.rotate+") ":"")+("none"!==B.scale?"scale("+B.scale.split(" ").join(",")+") ":"")+("none"!==B[cr]?B[cr]:"")),F.scale=F.rotate=F.translate="none"),m=ke(t,r.svg),r.svg&&(M=r.uncache?(P=t.getBBox(),Y=r.xOrigin-P.x+"px "+(r.yOrigin-P.y)+"px",""):!e&&t.getAttribute("data-svg-origin"),le(t,M||Y,!!M||r.originIsAbsolute,!1!==r.smooth,m)),p=r.xOrigin||0,_=r.yOrigin||0,m!==wr&&(T=m[0],b=m[1],w=m[2],x=m[3],i=O=m[4],n=k=m[5],6===m.length?(s=Math.sqrt(T*T+b*b),o=Math.sqrt(x*x+w*w),u=T||b?ur(b,T)*sr:0,(f=w||x?ur(w,x)*sr+u:0)&&(o*=Math.abs(Math.cos(f*or))),r.svg&&(i-=p-(p*T+_*w),n-=_-(p*b+_*x))):(R=m[6],E=m[7],A=m[8],S=m[9],z=m[10],D=m[11],i=m[12],n=m[13],a=m[14],h=(g=ur(R,z))*sr,g&&(M=O*(v=Math.cos(-g))+A*(y=Math.sin(-g)),P=k*v+S*y,C=R*v+z*y,A=O*-y+A*v,S=k*-y+S*v,z=R*-y+z*v,D=E*-y+D*v,O=M,k=P,R=C),l=(g=ur(-w,z))*sr,g&&(v=Math.cos(-g),D=x*(y=Math.sin(-g))+D*v,T=M=T*v-A*y,b=P=b*v-S*y,w=C=w*v-z*y),u=(g=ur(b,T))*sr,g&&(M=T*(v=Math.cos(g))+b*(y=Math.sin(g)),P=O*v+k*y,b=b*v-T*y,k=k*v-O*y,T=M,O=P),h&&359.9<Math.abs(h)+Math.abs(u)&&(h=u=0,l=180-l),s=ia(Math.sqrt(T*T+b*b+w*w)),o=ia(Math.sqrt(k*k+R*R)),g=ur(O,k),f=2e-4<Math.abs(g)?g*sr:0,c=D?1/(D<0?-D:D):0),r.svg&&(M=t.getAttribute("transform"),r.forceCSS=t.setAttribute("transform","")||!ie(Pd(t,cr)),M&&t.setAttribute("transform",M))),90<Math.abs(f)&&Math.abs(f)<270&&(L?(s*=-1,f+=u<=0?180:-180,u+=u<=0?180:-180):(o*=-1,f+=f<=0?180:-180)),e=e||r.uncache,r.x=i-((r.xPercent=i&&(!e&&r.xPercent||(Math.round(t.offsetWidth/2)===Math.round(-i)?-50:0)))?t.offsetWidth*r.xPercent/100:0)+"px",r.y=n-((r.yPercent=n&&(!e&&r.yPercent||(Math.round(t.offsetHeight/2)===Math.round(-n)?-50:0)))?t.offsetHeight*r.yPercent/100:0)+"px",r.z=a+"px",r.scaleX=ia(s),r.scaleY=ia(o),r.rotation=ia(u)+I,r.rotationX=ia(h)+I,r.rotationY=ia(l)+I,r.skewX=f+I,r.skewY=d+I,r.transformPerspective=c+"px",(r.zOrigin=parseFloat(Y.split(" ")[2])||!e&&r.zOrigin||0)&&(F[pr]=kr(Y)),r.xOffset=r.yOffset=0,r.force3D=q.force3D,r.renderTransform=r.svg?zr:Ye?Sr:Mr,r.uncache=0,r},kr=function _firstTwoOnly(t){return(t=t.split(" "))[0]+" "+t[1]},Mr=function _renderNon3DTransforms(t,e){e.z="0px",e.rotationY=e.rotationX="0deg",e.force3D=0,Sr(t,e)},Pr="0deg",Cr="0px",Ar=") ",Sr=function _renderCSSTransforms(t,e){var r=e||this,i=r.xPercent,n=r.yPercent,a=r.x,s=r.y,o=r.z,u=r.rotation,h=r.rotationY,l=r.rotationX,f=r.skewX,d=r.skewY,c=r.scaleX,p=r.scaleY,_=r.transformPerspective,m=r.force3D,g=r.target,v=r.zOrigin,y="",T="auto"===m&&t&&1!==t||!0===m;if(v&&(l!==Pr||h!==Pr)){var b,w=parseFloat(h)*or,x=Math.sin(w),O=Math.cos(w);w=parseFloat(l)*or,b=Math.cos(w),a=oe(g,a,x*b*-v),s=oe(g,s,-Math.sin(w)*-v),o=oe(g,o,O*b*-v+v)}_!==Cr&&(y+="perspective("+_+Ar),(i||n)&&(y+="translate("+i+"%, "+n+"%) "),!T&&a===Cr&&s===Cr&&o===Cr||(y+=o!==Cr||T?"translate3d("+a+", "+s+", "+o+") ":"translate("+a+", "+s+Ar),u!==Pr&&(y+="rotate("+u+Ar),h!==Pr&&(y+="rotateY("+h+Ar),l!==Pr&&(y+="rotateX("+l+Ar),f===Pr&&d===Pr||(y+="skew("+f+", "+d+Ar),1===c&&1===p||(y+="scale("+c+", "+p+Ar),g.style[cr]=y||"translate(0, 0)"},zr=function _renderSVGTransforms(t,e){var r,i,n,a,s,o=e||this,u=o.xPercent,h=o.yPercent,l=o.x,f=o.y,d=o.rotation,c=o.skewX,p=o.skewY,_=o.scaleX,m=o.scaleY,g=o.target,v=o.xOrigin,y=o.yOrigin,T=o.xOffset,b=o.yOffset,w=o.forceCSS,x=parseFloat(l),O=parseFloat(f);d=parseFloat(d),c=parseFloat(c),(p=parseFloat(p))&&(c+=p=parseFloat(p),d+=p),d||c?(d*=or,c*=or,r=Math.cos(d)*_,i=Math.sin(d)*_,n=Math.sin(d-c)*-m,a=Math.cos(d-c)*m,c&&(p*=or,s=Math.tan(c-p),n*=s=Math.sqrt(1+s*s),a*=s,p&&(s=Math.tan(p),r*=s=Math.sqrt(1+s*s),i*=s)),r=ia(r),i=ia(i),n=ia(n),a=ia(a)):(r=_,a=m,i=n=0),(x&&!~(l+"").indexOf("px")||O&&!~(f+"").indexOf("px"))&&(x=_d(g,"x",l,"px"),O=_d(g,"y",f,"px")),(v||y||T||b)&&(x=ia(x+v-(v*r+y*n)+T),O=ia(O+y-(v*i+y*a)+b)),(u||h)&&(s=g.getBBox(),x=ia(x+u/100*s.width),O=ia(O+h/100*s.height)),s="matrix("+r+","+i+","+n+","+a+","+x+","+O+")",g.setAttribute("transform",s),w&&(g.style[cr]=s)};ha("padding,margin,Width,Radius",function(e,r){var t="Right",i="Bottom",n="Left",o=(r<3?["Top",t,i,n]:["Top"+n,"Top"+t,i+t,i+n]).map(function(t){return r<2?e+t:"border"+t+e});br[1<r?"border"+e:e]=function(e,t,r,i,n){var a,s;if(arguments.length<4)return a=o.map(function(t){return yr(e,t,r)}),5===(s=a.join(" ")).split(a[0]).length?a[0]:s;a=(i+"").split(" "),s={},o.forEach(function(t,e){return s[t]=a[e]=a[e]||a[(e-1)/2|0]}),e.init(t,s,n)}});var Er,Dr,Rr,Fr={name:"css",register:Sd,targetTest:function targetTest(t){return t.style&&t.nodeType},init:function init(t,e,i,n,a){var s,o,u,h,l,f,d,c,p,_,m,g,v,y,T,b,w=this._props,x=t.style,O=i.vars.startAt;for(d in Fe||Sd(),this.styles=this.styles||Md(t),b=this.styles.props,this.tween=i,e)if("autoRound"!==d&&(o=e[d],!pt[d]||!ac(d,e,i,n,t,a)))if(l=typeof o,f=br[d],"function"===l&&(l=typeof(o=o.call(i,n,t,a))),"string"===l&&~o.indexOf("random(")&&(o=ob(o)),f)f(this,t,d,o,i)&&(T=1);else if("--"===d.substr(0,2))s=(getComputedStyle(t).getPropertyValue(d)+"").trim(),o+="",Et.lastIndex=0,Et.test(s)||(c=Ya(s),p=Ya(o)),p?c!==p&&(s=_d(t,d,s,p)+p):c&&(o+=c),this.add(x,"setProperty",s,o,n,a,0,0,d),w.push(d),b.push(d,0,x[d]);else if("undefined"!==l){if(O&&d in O?(s="function"==typeof O[d]?O[d].call(i,n,t,a):O[d],r(s)&&~s.indexOf("random(")&&(s=ob(s)),Ya(s+"")||"auto"===s||(s+=q.units[d]||Ya(yr(t,d))||""),"="===(s+"").charAt(1)&&(s=yr(t,d))):s=yr(t,d),h=parseFloat(s),(_="string"===l&&"="===o.charAt(1)&&o.substr(0,2))&&(o=o.substr(2)),u=parseFloat(o),d in dr&&("autoAlpha"===d&&(1===h&&"hidden"===yr(t,"visibility")&&u&&(h=0),b.push("visibility",0,x.visibility),Yd(this,x,"visibility",h?"inherit":"hidden",u?"inherit":"hidden",!u)),"scale"!==d&&"transform"!==d&&~(d=dr[d]).indexOf(",")&&(d=d.split(",")[0])),m=d in ar)if(this.styles.save(d),g||((v=t._gsap).renderTransform&&!e.parseTransform||Or(t,e.parseTransform),y=!1!==e.smoothOrigin&&v.smooth,(g=this._pt=new _e(this._pt,x,cr,0,1,v.renderTransform,v,0,-1)).dep=1),"scale"===d)this._pt=new _e(this._pt,v,"scaleY",v.scaleY,(_?ka(v.scaleY,_+u):u)-v.scaleY||0,vd),this._pt.u=0,w.push("scaleY",d),d+="X";else{if("transformOrigin"===d){b.push(pr,0,x[pr]),o=de(o),v.svg?le(t,o,0,y,0,this):((p=parseFloat(o.split(" ")[2])||0)!==v.zOrigin&&Yd(this,v,"zOrigin",v.zOrigin,p),Yd(this,x,d,kr(s),kr(o)));continue}if("svgOrigin"===d){le(t,o,1,y,0,this);continue}if(d in xr){ve(this,v,d,h,_?ka(h,_+o):o);continue}if("smoothOrigin"===d){Yd(this,v,"smooth",v.smooth,o);continue}if("force3D"===d){v[d]=o;continue}if("transform"===d){xe(this,o,t);continue}}else d in x||(d=mr(d)||d);if(m||(u||0===u)&&(h||0===h)&&!fr.test(o)&&d in x)u=u||0,(c=(s+"").substr((h+"").length))!==(p=Ya(o)||(d in q.units?q.units[d]:c))&&(h=_d(t,d,s,p)),this._pt=new _e(this._pt,m?v:x,d,h,(_?ka(h,_+u):u)-h,m||"px"!==p&&"zIndex"!==d||!1===e.autoRound?vd:yd),this._pt.u=p||0,c!==p&&"%"!==p&&(this._pt.b=s,this._pt.r=xd);else if(d in x)be.call(this,t,d,s,_?_+o:o);else if(d in t)this.add(t,d,s||t[d],_?_+o:o,n,a);else if("parseTransform"!==d){Q(d,o);continue}m||(d in x?b.push(d,0,x[d]):b.push(d,1,s||t[d])),w.push(d)}T&&pe(this)},render:function render(t,e){if(e.tween._time||!Be())for(var r=e._pt;r;)r.r(t,r.d),r=r._next;else e.styles.revert()},get:yr,aliases:dr,getSetter:function getSetter(t,e,r){var i=dr[e];return i&&i.indexOf(",")<0&&(e=i),e in ar&&e!==pr&&(t._gsap.x||yr(t,"x"))?r&&Ie===r?"scale"===e?Ed:Dd:(Ie=r||{})&&("scale"===e?Fd:Gd):t.style&&!u(t.style[e])?Bd:~e.indexOf("-")?Cd:ne(t,e)},core:{_removeProperty:Xd,_getMatrix:ke}};ze.utils.checkPrefix=mr,ze.core.getStyleSaver=Md,Rr=ha((Er="x,y,z,scale,scaleX,scaleY,xPercent,yPercent")+","+(Dr="rotation,rotationX,rotationY,skewX,skewY")+",transform,transformOrigin,svgOrigin,force3D,smoothOrigin,transformPerspective",function(t){ar[t]=1}),ha(Dr,function(t){q.units[t]="deg",xr[t]=1}),dr[Rr[13]]=Er+","+Dr,ha("0:translateX,1:translateY,2:translateZ,8:rotate,8:rotationZ,8:rotateZ,9:rotateX,10:rotateY",function(t){var e=t.split(":");dr[e[1]]=Rr[e[0]]}),ha("x,y,z,top,right,bottom,left,width,height,fontSize,padding,margin,perspective",function(t){q.units[t]="px"}),ze.registerPlugin(Fr);var Lr=ze.registerPlugin(Fr)||ze,Ir=Lr.core.Tween;e.Back=Ze,e.Bounce=er,e.CSSPlugin=Fr,e.Circ=nr,e.Cubic=Qe,e.Elastic=$e,e.Expo=ir,e.Linear=Ge,e.Power0=qe,e.Power1=Ve,e.Power2=Ue,e.Power3=Xe,e.Power4=Ne,e.Quad=We,e.Quart=Ke,e.Quint=Je,e.Sine=rr,e.SteppedEase=tr,e.Strong=He,e.TimelineLite=Xt,e.TimelineMax=Xt,e.TweenLite=$t,e.TweenMax=Ir,e.default=Lr,e.gsap=Lr;if (typeof(window)==="undefined"||window!==e){Object.defineProperty(e,"__esModule",{value:!0})} else {delete e.default}});
;
/* === overlay-rpc777.js === */
(() => {
  "use strict";

  const ns = window.DemoInvitacion = window.DemoInvitacion || {};

  function setup(data) {
    const entry = document.getElementById("entrada");
    const open = document.querySelector("[data-open]");
    const card = entry?.querySelector(".overlay-card, .envelope-card, .envelope-panel");
    const video = document.getElementById("entrada-video") || entry?.querySelector(".entry-video");
    const posterFrame = document.getElementById("entrada-primer-frame") || entry?.querySelector(".entry-poster-frame");
    const entrada = data.entrada || {};
    const label = entrada.boton || entrada.hint || "Abrir invitación";
    const videoSrc = firstText(entrada.video, entrada.src, video?.getAttribute("src"));
    const poster = firstText(entrada.poster, posterFrame?.getAttribute("src"), video?.getAttribute("poster"));
    const hasEntryVideo = Boolean(video && videoSrc);
    let opened = false;
    let videoStarted = false;
    let fallbackTimer = 0;

    ns.helpers.setText("entrada-boton", label);
    ns.helpers.setText("overlay-title", hasEntryVideo ? label : (entrada.boton || entrada.titulo || label));
    ns.helpers.setText("overlay-hint", hasEntryVideo ? "" : (entrada.hint || "Toca para abrir"));
    ns.helpers.setText("overlay-nombre", hasEntryVideo ? "" : (data.nombre || entrada.nombre || ""));
    open?.setAttribute("aria-label", label);

    if (hasEntryVideo) {
      entry?.classList.add("has-entry-video");
      video.setAttribute("src", videoSrc);
      if (poster) video.setAttribute("poster", poster);
      video.muted = true;
      video.playsInline = true;
      video.preload = "auto";
      video.removeAttribute("controls");
    } else {
      entry?.classList.remove("has-entry-video");
    }

    if (posterFrame && poster) {
      posterFrame.setAttribute("src", poster);
    }

    animateOpenButton(open);
    card?.removeAttribute("hidden");
    entry?.classList.remove("is-entry-loading");

    const hidePosterFrame = () => {
      if (!posterFrame) return;
      posterFrame.hidden = true;
      posterFrame.style.display = "none";
    };

    const openInvitation = () => {
      if (opened) return;
      opened = true;
      window.clearTimeout(fallbackTimer);
      hidePosterFrame();
      entry?.classList.remove("is-video-playing");
      video?.pause?.();
      document.body.classList.add("is-open");
      document.body.style.overflow = "";
      window.dispatchEvent(new Event("entradaInteraccion"));
      window.dispatchEvent(new Event("invitacionAbierta"));
      window.dispatchEvent(new Event("sobreAbierto"));
      ns.musica?.tryPlay?.();
      hideEntry(entry, 720);
    };

    const startEntry = () => {
      if (opened || videoStarted) return;

      if (!video || !videoSrc) {
        openInvitation();
        return;
      }

      videoStarted = true;
      hidePosterFrame();
      entry?.classList.add("is-video-playing");
      ns.musica?.pause?.(false);
      window.dispatchEvent(new Event("entradaInteraccion"));

      try {
        video.currentTime = 0;
      } catch (_) {}

      const finish = () => openInvitation();
      video.addEventListener("ended", finish, { once: true });
      video.addEventListener("error", finish, { once: true });
      fallbackTimer = window.setTimeout(finish, 9000);

      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(finish);
      }
    };

    open?.addEventListener("click", startEntry);
    card?.addEventListener("click", event => {
      if (event.target.closest("[data-open]")) return;
      startEntry();
    });
    entry?.addEventListener("pointerdown", event => {
      if (event.target.closest("[data-music], .music-button, #music-toggle")) return;
      startEntry();
    });
    entry?.addEventListener("keydown", event => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      startEntry();
    });
  }

  function firstText(...values) {
    return values.find(value => typeof value === "string" && value.trim())?.trim() || "";
  }

  function animateOpenButton(button) {
    if (!button || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const gsap = window.gsap;
    if (!gsap) return;

    gsap.killTweensOf(button);
    gsap.fromTo(button, {
      autoAlpha: 0,
      y: 46,
      scale: 0.76,
      rotateX: -18,
      filter: "blur(6px)",
      transformOrigin: "50% 100%",
      willChange: "transform, opacity, filter"
    }, {
      autoAlpha: 1,
      y: 0,
      scale: 1,
      rotateX: 0,
      filter: "blur(0px)",
      duration: 1.15,
      delay: 0.4,
      ease: "back.out(1.8)",
      clearProps: "opacity,visibility,transform,transformOrigin,filter,willChange"
    });
  }

  function hideEntry(entry, delay) {
    if (!entry) return;
    entry.setAttribute("aria-hidden", "true");
    entry.style.pointerEvents = "none";
    entry.classList.add("is-leaving");
    window.setTimeout(() => {
      entry.hidden = true;
      entry.style.display = "none";
    }, delay);
  }

  ns.overlay = { setup };
})();
;
/* === musica-rpcd78.js === */
(() => {
  "use strict";

  const ns = window.DemoInvitacion = window.DemoInvitacion || {};
  const openSelectors = [
    "#opening-envelope",
    "#open-invitation",
    "#entrada",
    "[data-open]",
    ".envelope-card",
    ".envelope-panel",
    ".overlay-card",
    ".open-seal",
    ".seal-control",
    ".seal-button"
  ];
  const openEvents = ["pointerdown", "touchstart", "touchend", "click"];
  const toggleEvents = ["pointerdown", "touchstart", "click"];
  const state = {
    audio: null,
    toggle: null,
    buttonBound: null,
    audioBound: null,
    openBound: false,
    lifecycleBound: false,
    userPaused: false,
    lastToggleAt: 0,
    lastPlayError: null
  };

  function setup(data) {
    const music = data?.musica || {};
    const audio = findAudio();
    const toggle = findToggle();
    const src = music.src || "";

    if (!audio || !toggle || music.activo === false || !src) {
      if (toggle) toggle.hidden = true;
      return;
    }

    state.audio = audio;
    state.toggle = toggle;
    configureAudio(audio, src);
    toggle.hidden = false;

    bindToggle();
    bindAudio();
    bindOpenUnlock();
    bindLifecycle();
    updateState();
  }

  function findAudio() {
    return byId("music") || document.querySelector("audio");
  }

  function findToggle() {
    return byId("music-toggle") || document.querySelector("[data-music]");
  }

  function byId(id) {
    return ns.helpers?.byId?.(id) || document.getElementById(id);
  }

  function configureAudio(audio, src) {
    if (audio.getAttribute("src") !== src) {
      audio.src = src;
      try {
        audio.load();
      } catch (_) {}
    }

    audio.loop = true;
    audio.preload = "auto";
    audio.autoplay = false;
    audio.removeAttribute("autoplay");
    audio.muted = false;
    if (audio.volume === 0) audio.volume = 1;
  }

  function bindToggle() {
    const toggle = state.toggle;
    if (!toggle || state.buttonBound === toggle) return;

    const onToggle = () => {
      const now = Date.now();
      if (now - state.lastToggleAt < 450) return;
      state.lastToggleAt = now;
      toggleMusic();
    };

    toggleEvents.forEach(eventName => {
      toggle.addEventListener(eventName, onToggle, { passive: true });
    });
    state.buttonBound = toggle;
  }

  function bindAudio() {
    const audio = state.audio;
    if (!audio || state.audioBound === audio) return;

    audio.addEventListener("play", updateState);
    audio.addEventListener("pause", updateState);
    audio.addEventListener("ended", updateState);
    state.audioBound = audio;
  }

  function bindOpenUnlock() {
    if (state.openBound) return;

    const targets = Array.from(document.querySelectorAll(openSelectors.join(",")));
    const unlock = () => {
      state.userPaused = false;
      play({ respectUserPause: false });
    };

    targets.forEach(target => {
      openEvents.forEach(eventName => {
        target.addEventListener(eventName, unlock, { capture: true, passive: true });
      });
    });

    window.addEventListener("entradaInteraccion", () => play());
    window.addEventListener("sobreAbierto", () => play());
    window.addEventListener("invitacionAbierta", () => play());
    state.openBound = true;
  }

  function bindLifecycle() {
    if (state.lifecycleBound) return;

    document.addEventListener("visibilitychange", () => {
      if (isHidden()) pause(false);
    });
    window.addEventListener("pagehide", () => pause(false));
    state.lifecycleBound = true;
  }

  function isHidden() {
    return document.hidden || document.visibilityState === "hidden";
  }

  function toggleMusic() {
    const audio = state.audio || findAudio();
    if (!audio) return Promise.resolve(false);

    if (audio.paused) {
      state.userPaused = false;
      return play({ respectUserPause: false });
    }

    return pause(true);
  }

  function tryPlay() {
    return play();
  }

  function play(options = {}) {
    const audio = state.audio || findAudio();
    const respectUserPause = options.respectUserPause !== false;

    if (!audio || !audio.src || isHidden()) {
      updateState();
      return Promise.resolve(false);
    }

    if (respectUserPause && state.userPaused) {
      updateState();
      return Promise.resolve(false);
    }

    audio.muted = false;
    if (audio.volume === 0) audio.volume = 1;

    if (!audio.paused) {
      updateState();
      return Promise.resolve(true);
    }

    state.lastPlayError = null;
    const playPromise = audio.play();
    if (!playPromise || typeof playPromise.then !== "function") {
      updateState();
      return Promise.resolve(!audio.paused);
    }

    return playPromise.then(() => {
      state.lastPlayError = null;
      updateState();
      return true;
    }).catch(error => {
      state.lastPlayError = error;
      updateState();
      return false;
    });
  }

  function pause(markUserPaused = true) {
    const audio = state.audio || findAudio();
    if (markUserPaused) state.userPaused = true;
    if (audio && !audio.paused) audio.pause();
    updateState();
    return Promise.resolve(false);
  }

  function updateState() {
    const audio = state.audio || findAudio();
    const toggle = state.toggle || findToggle();
    if (!audio || !toggle) return;

    const active = !audio.paused;
    toggle.classList.toggle("is-playing", active);
    toggle.classList.toggle("is-muted", !active);
    toggle.setAttribute("aria-pressed", String(active));
    toggle.setAttribute("aria-label", active ? "Pausar música" : "Activar música");

    if (state.lastPlayError) {
      toggle.dataset.audioBlocked = "true";
    } else {
      delete toggle.dataset.audioBlocked;
    }
  }

  ns.musica = { setup, tryPlay, play, pause, toggleMusic, updateState, update: updateState };
})();
;
/* === reveal-rpcd78.js === */
(() => {
  "use strict";
  const ns = window.DemoInvitacion = window.DemoInvitacion || {};
  function setup() {
    const revealItems = [
      ...document.querySelectorAll(".portrait-frame"), ...document.querySelectorAll(".memory-strip"), ...document.querySelectorAll(".gallery-grid img"),
      ...document.querySelectorAll(".event-card"), ...document.querySelectorAll(".detalle-card"), ...document.querySelectorAll(".timeline-list li"),
      ...document.querySelectorAll(".wonder-ornament"), ...document.querySelectorAll(".rama-espiral")
    ];
    revealItems.forEach((item, index) => { item.classList.add("magic-reveal"); item.style.setProperty("--reveal-delay", Math.min(index * 85, 420) + "ms"); });
    if (!("IntersectionObserver" in window)) return revealItems.forEach(item => item.classList.add("is-visible"));
    const observer = new IntersectionObserver(entries => { entries.forEach(entry => { if (!entry.isIntersecting) return; entry.target.classList.add("is-visible"); observer.unobserve(entry.target); }); }, { threshold: 0.22, rootMargin: "0px 0px -8% 0px" });
    revealItems.forEach(item => observer.observe(item));
  }
  ns.reveal = { setup };
})();
;
/* === render-rpcd78.js === */
(() => {
  "use strict";
  const ns = window.DemoInvitacion = window.DemoInvitacion || {}; ns.secciones = ns.secciones || {};
  function renderAll(data) {
    renderHero(data); renderFecha(data); renderFotos(data); renderFamily(data); renderLocations(data); renderTimeline(data); renderDetails(data); renderDressCode(data); renderGallery(data); renderList("notas-lista", data.notas || []); renderLabels(data); renderConfirmation(data); renderCierre(data);
  }
  function renderHero(data) { const h = ns.helpers; h.setText("hero-eyebrow", data.hero?.eyebrow); h.setText("hero-name", data.hero?.nombre); h.setText("hero-mood", data.hero?.frase); h.setAttr("foto-portada", "src", data.hero?.foto); h.setAttr("foto-portada", "alt", data.hero?.fotoAlt || data.hero?.nombre || "Foto principal"); h.setOptionalText("nav-familia", data.navegacion?.familia, "Familia"); h.setOptionalText("nav-ubicaciones", data.navegacion?.ubicaciones, "Mapa"); h.setOptionalText("nav-confirmacion", data.navegacion?.confirmacion, "RSVP"); }
  function renderFecha(data) { const h = ns.helpers; h.setText("bendicion-texto", data.fechaBendicion || data.fecha?.bendicion || data.familia?.[0]?.bendicion || ""); h.setText("fecha-texto", data.fechaTexto || data.fecha?.["texto"] || ""); h.setText("count-dias", data.contador?.dias || "Días"); h.setText("count-horas", data.contador?.horas || "Hrs"); h.setText("count-minutos", data.contador?.minutos || "Min"); h.setText("count-segundos", data.contador?.segundos || "Seg"); const countdown = document.querySelector(".countdown"); if (countdown) { countdown.dataset.estilo = data.reloj?.estilo || "digital"; countdown.dataset.clockStyle = "cuento"; } }
  function renderFotos(data) { const h = ns.helpers; const memory = document.querySelector(".memory-strip"); memory?.classList.toggle("is-gradient", data.memory?.gradient !== false); h.setAttr("foto-destacada", "src", data.memory?.src); h.setAttr("foto-destacada", "alt", data.memory?.alt || "Foto destacada"); h.setText("memory-text", data.memory?.texto); }
  function renderFamily(data) { const h = ns.helpers; const list = h.byId("familia-lista"); const grupos = (data.familia || []).filter(group => group?.activo !== false); if (!list || !grupos.length) return h.hide("familia"); list.innerHTML = grupos.map(group => '<div class="name-group"><h3>' + h.escapeHtml(group.titulo || '') + '</h3><p>' + (group.nombres || []).map((name,index,arr)=> '<span class="family-name">' + h.escapeHtml(name) + '</span>' + (index < arr.length - 1 ? '<span class="family-amp">y</span>' : '')).join('') + '</p></div>').join(''); }
  function renderLocations(data) { const h = ns.helpers; const list = h.byId("ubicaciones-lista"); if (!list) return; const buttonLabel = data.secciones?.ubicacionBoton || data.labels?.ubicacionBoton || "Ver ubicación"; list.innerHTML = (data.ubicaciones || []).map(item => { const horarios = Array.isArray(item.horarios) ? item.horarios : (item.hora ? [item.hora] : []); return '<article class="event-card event-card--ubicacion">' + (item.foto ? '<figure class="event-card-media"><img src="' + h.escapeHtml(item.foto) + '" alt="' + h.escapeHtml(item.fotoAlt || item.lugar || item.tipo || 'Ubicación') + '" loading="lazy"></figure>' : '') + '<div class="event-card-body"><span>' + h.escapeHtml(item.tipo || item.titulo || '') + '</span><strong>' + h.escapeHtml(item.lugar || item.nombre || '') + '</strong>' + (item.direccion ? '<p>' + h.escapeHtml(item.direccion) + '</p>' : '') + horarios.map(hora => '<em>' + h.escapeHtml(hora) + '</em>').join('') + (item.url ? '<a class="map-button location-button" href="' + h.escapeHtml(h.safeUrl(item.url)) + '" target="_blank" rel="noreferrer">' + h.escapeHtml(item.boton || buttonLabel) + '</a>' : '') + '</div></article>'; }).join(''); }
  function renderTimeline(data) { const h = ns.helpers; const list = h.byId("itinerario-lista"); if (!list) return; list.dataset.estilo = data.itinerarioEstilo || "linea"; list.innerHTML = (data.itinerario || []).filter(item => item?.activo !== false).map(item => '<li class="' + (item.icono ? 'timeline-has-icon' : '') + '">' + (item.icono ? '<span class="timeline-icon"><img src="' + h.escapeHtml(item.icono) + '" alt="" loading="lazy"></span>' : '') + '<time>' + h.escapeHtml(item.hora || '') + '</time><span>' + h.escapeHtml(item.titulo || item.nombre || '') + '</span></li>').join(''); }
  function renderDetails(data) { const h = ns.helpers; const list = h.byId("detalles-lista"); if (!list) return; const detalles = data.detalles; if (Array.isArray(detalles)) return renderList("detalles-lista", detalles); const cards = []; const sobres = detalles?.lluviaSobres; const buzon = detalles?.buzonDeseos || detalles?.buzon || detalles?.["Buzón de deseos"] || detalles?.["Buzon de deseos"]; if (sobres && sobres.activo !== false) cards.push('<li class="detalle-card detalle-card--sobres"><div class="sobre-rain" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="detalle-body"><strong>' + h.escapeHtml(sobres.titulo || '') + '</strong><span>' + h.escapeHtml(sobres.texto || '') + '</span></div></li>'); if (buzon && buzon.activo !== false) { const whatsapp = buzon.whatsapp || {}; const whatsappUrl = whatsapp.activo === false ? '' : h.whatsappUrl(whatsapp.numero, whatsapp.mensajeBase || buzon.texto || ''); cards.push('<li class="detalle-card detalle-card--buzon">' + (buzon.media ? '<figure class="detalle-media"><img src="' + h.escapeHtml(buzon.media) + '" alt="' + h.escapeHtml(buzon.alt || '') + '" loading="lazy"></figure>' : '') + '<div class="detalle-body"><strong>' + h.escapeHtml(buzon.titulo || '') + '</strong><span>' + h.escapeHtml(buzon.texto || '') + '</span>' + (whatsappUrl ? '<a class="map-button detalle-button" href="' + h.escapeHtml(whatsappUrl) + '" target="_blank" rel="noopener noreferrer">' + h.escapeHtml(whatsapp.boton || 'Enviar deseo') + '</a>' : '') + '</div></li>'); } list.innerHTML = cards.join(''); }
  function renderDressCode(data) { const h = ns.helpers; const title = h.byId("vestimenta-titulo"); const content = h.byId("vestimenta-contenido"); const v = data.vestimenta; if (!v) { if (content) content.innerHTML = ""; return; } if (title) title.textContent = v.titulo || "Vestimenta"; if (!content) return; const no = Array.isArray(v.coloresNoPermitidos) ? v.coloresNoPermitidos : []; content.innerHTML = '<article class="dress-card">' + (v.media ? '<figure class="dress-media"><img src="' + h.escapeHtml(v.media) + '" alt="' + h.escapeHtml(v.alt || '') + '" loading="lazy"></figure>' : '') + '<div class="dress-body"><p>' + h.escapeHtml(v.texto || '') + '</p>' + (no.length ? '<div class="dress-no"><strong>' + h.escapeHtml(v.coloresNoPermitidosTitulo || 'Colores no permitidos') + '</strong><div>' + no.map(color => '<span>' + h.escapeHtml(color) + '</span>').join('') + '</div></div>' : '') + '</div></article>'; }
  function renderGallery(data) { const h = ns.helpers; const grid = h.byId("galeria-lista"); if (!grid) return; const items = data.galeria || []; ns.state.galleryItems = items.map(item => item.src || item).filter(Boolean); grid.innerHTML = items.map((item,index) => '<button class="gallery-item" type="button" data-gallery-index="' + index + '" aria-label="' + h.escapeHtml(item.alt || 'Ver foto ' + (index + 1)) + '"><img src="' + h.escapeHtml(item.src || item) + '" alt="' + h.escapeHtml(item.alt || 'Foto ' + (index + 1)) + '" loading="lazy"></button>').join(''); }
  function renderList(id, items) { const h = ns.helpers; const list = h.byId(id); if (!list) return; list.innerHTML = items.map(item => '<li>' + h.escapeHtml(item) + '</li>').join(''); }
  function renderLabels(data) { const h = ns.helpers; const s = data.secciones || {}; h.setText("familia-eyebrow", s.familiaEyebrow || "Con amor"); h.setText("familia-titulo", s.familiaTitulo || ""); h.setText("ubicaciones-eyebrow", s.ubicacionesEyebrow || "Dónde"); h.setText("ubicaciones-titulo", s.ubicacionesTitulo || "Ubicaciones"); h.setText("itinerario-eyebrow", s.itinerarioEyebrow || "Programa"); h.setText("itinerario-titulo", s.itinerarioTitulo || "Itinerario"); h.setText("detalles-eyebrow", s.detallesEyebrow || "Regalos"); h.setText("detalles-titulo", s.detallesTitulo || "Regalos"); h.setText("vestimenta-eyebrow", s.vestimentaEyebrow || "Dress code"); h.setText("galeria-eyebrow", s.galeriaEyebrow || "Galería"); h.setText("galeria-titulo", s.galeriaTitulo || "Fotos"); h.setText("notas-eyebrow", s.notasEyebrow || "Importante"); h.setText("notas-titulo", s.notasTitulo || "Notas"); h.setText("confirmacion-eyebrow", s.confirmacionEyebrow || "RSVP"); }
  function renderConfirmation(data) { const h = ns.helpers; const c = data.confirmacion || {}; const button = h.byId("rsvp-boton"); const form = button?.closest("form"); const guestsInput = h.byId("rsvp-invitados"); const omitGuests = shouldOmitGuests(c, form); h.setText("confirmacion-titulo", c.titulo || "Confirma tu asistencia"); h.setAttr("rsvp-nombre", "placeholder", c.nombrePlaceholder || "Nombre y apellido"); h.setAttr("rsvp-invitados", "aria-label", c.invitadosLabel || "Número de invitados"); h.setAttr("rsvp-mensaje", "placeholder", c.mensajePlaceholder || "Mensaje opcional"); h.setText("rsvp-boton", c.boton || "Enviar confirmación"); toggleGuestsInput(guestsInput, omitGuests); renderConfirmationVisual(c); button?.addEventListener("click", () => sendRsvp(c, data)); }
  function renderConfirmationVisual(c) { const h = ns.helpers; const box = h.byId("confirmacion-visual"); if (!box) return; if (!c.media && !c.texto) { box.innerHTML = ""; return; } box.innerHTML = '<article class="confirmacion-card">' + (c.media ? '<figure class="confirmacion-media"><img src="' + h.escapeHtml(c.media) + '" alt="' + h.escapeHtml(c.alt || '') + '" loading="lazy"></figure>' : '') + (c.texto ? '<p>' + h.escapeHtml(c.texto) + '</p>' : '') + '</article>'; }
  function shouldOmitGuests(c, form) { return !(c.pedirInvitados === true || c.invitadosActivo === true || c.omitirInvitados === false || c.omitGuests === false || form?.dataset.allowGuests === "true"); }
  function toggleGuestsInput(input, omitGuests) { if (!input) return; input.hidden = omitGuests; input.disabled = omitGuests; if (omitGuests) { input.removeAttribute("required"); input.setAttribute("aria-hidden", "true"); input.removeAttribute("name"); } else { input.removeAttribute("aria-hidden"); } }
  function sendRsvp(c, data) { const h = ns.helpers; const name = h.byId("rsvp-nombre")?.value?.trim() || "Invitado"; const guestsInput = h.byId("rsvp-invitados"); const form = h.byId("rsvp-boton")?.closest("form"); const omitGuests = shouldOmitGuests(c, form) || !guestsInput; const guests = omitGuests ? "" : (guestsInput?.value || "1"); const note = h.byId("rsvp-mensaje")?.value?.trim() || ""; const base = c.mensaje || "Hola, confirmo mi asistencia a " + ((data.hero && data.hero.nombre) || "el evento") + "."; const text = base + " Nombre: " + name + "." + (guests ? " Invitados: " + guests + "." : "") + (note ? " " + note : ""); window.open(h.whatsappUrl(c.telefono || "", text), "_blank", "noopener"); }
  function renderCierre(data) { const h = ns.helpers; const cierre = data.cierre || {}; h.setText("cierre-eyebrow", cierre.titulo || "Te esperamos"); h.setText("farewell-name", data.nombre || data.hero?.nombre || ""); h.setText("cierre-nota", cierre.nota || ""); }
  ns.secciones.renderAll = renderAll;
})();
;
/* === qr-fotos-rpcd78.js === */
(() => {
  "use strict";

  const HIDDEN_CLASS = "esconder";
  const DEFAULT_PASS_ICON = "img/pase41f6.png?cache=88";
  let fallbackLoaded = false;

  document.addEventListener("DOMContentLoaded", () => {
    injectStyles();
    loadFallbackConfig().then(applyExtras);
  });

  window.addEventListener("demo:ready", (event) => {
    injectStyles();
    applyExtras(event.detail || {});
  });

  async function loadFallbackConfig() {
    if (fallbackLoaded) return null;
    fallbackLoaded = true;
    const source = document.body?.dataset?.demoJson;
    if (!source) return null;

    try {
      const response = await fetch((source.includes("?") ? source : `${source}?cache=88`), { cache: "no-store" });
      if (!response.ok) return null;
      return response.json();
    } catch (_) {
      return null;
    }
  }

  function applyExtras(config) {
    if (!config || typeof config !== "object") return;
    renderQrFotos(config);
    renderQrPases(config);
    renderPases(config);
    applySectionAliases(config);
  }

  function renderQrFotos(config) {
    renderQrSection(config, {
      sectionId: "qr-fotos",
      sectionKeys: ["qrFotos", "fotosQr", "qr"],
      dataKeys: ["qrFotos", "fotosQr", "qr"],
      defaultEyebrow: "Fotos",
      defaultTitle: "Comparte tus fotos",
      defaultAlt: "QR para compartir fotos"
    });
  }

  function renderQrPases(config) {
    renderQrSection(config, {
      sectionId: "qr-pases",
      sectionKeys: ["qrPases"],
      dataKeys: ["qrPases"],
      defaultEyebrow: "Pases",
      defaultTitle: "Pases digitales",
      defaultAlt: "QR de pases digitales"
    });
  }

  function renderQrSection(config, options) {
    const sectionId = options.sectionId;
    const target = document.getElementById(sectionId);
    if (!target) return;

    const raw = config.__rawConfig || {};
    const sections = raw.secciones || config.secciones || {};
    const cfg = firstObject(
      ...options.dataKeys.flatMap((key) => [raw[key], config[key]])
    );
    const enabled = options.sectionKeys.every((key) => sections[key] !== false) && cfg.activo !== false;
    const hasContent = hasText(cfg.titulo) || hasText(cfg.texto) || hasText(cfg.imagen) || hasText(cfg.url);

    if (!enabled || !hasContent) {
      setVisible(target, false);
      clearQr(target, sectionId);
      return;
    }

    setText(`${sectionId}-eyebrow`, firstText(cfg.eyebrow, cfg.kicker, options.defaultEyebrow));
    setText(`${sectionId}-title`, firstText(cfg.titulo, options.defaultTitle));
    setText(`${sectionId}-text`, cfg.texto);

    const image = document.getElementById(`${sectionId}-image`);
    const media = document.getElementById(`${sectionId}-media`);
    if (image && hasText(cfg.imagen)) {
      image.src = cfg.imagen;
      image.alt = firstText(cfg.alt, cfg.titulo, options.defaultAlt);
      setVisible(media, true);
    } else {
      if (image) {
        image.removeAttribute("src");
        image.removeAttribute("alt");
      }
      setVisible(media, false);
    }

    const link = document.getElementById(`${sectionId}-link`);
    if (link && hasText(cfg.url)) {
      link.href = cfg.url;
      link.textContent = firstText(cfg.boton, "Abrir enlace");
      setVisible(link, true);
    } else if (link) {
      link.removeAttribute("href");
      link.textContent = "";
      setVisible(link, false);
    }

    setVisible(target, true);
  }

  function renderPases(config) {
    const section = document.getElementById("pases");
    if (!section) return;

    const raw = config.__rawConfig || {};
    const sections = raw.secciones || config.secciones || {};
    const cfg = firstObject(raw.pases, config.pases, raw.pase, config.pase);
    const paseCantidad = getDatasetPassQuantity();
    const paseLabel = getDatasetPassLabel(paseCantidad);
    const hasPassQuantity = paseCantidad > 0;
    const enabled = hasPassQuantity || (sections.pases !== false && cfg.activo !== false);
    const hasContent = hasPassQuantity || hasText(cfg.titulo) || hasText(cfg.texto) || hasText(cfg.url);

    if (!enabled || !hasContent) {
      setVisible(section, false);
      clearPases();
      return;
    }

    setText("pases-eyebrow", firstText(cfg.eyebrow, cfg.kicker, "Pases"));
    renderPassIcon(cfg);
    if (hasPassQuantity) {
      renderPassQuantityTitle(paseCantidad, paseLabel);
      setText("pases-text", firstText(cfg.texto, "No olvides presentar este pase en la entrada."));
    } else {
      setText("pases-title", firstText(cfg.titulo, "Pases de entrada"));
      setText("pases-text", cfg.texto);
    }

    const link = document.getElementById("pases-link");
    if (link && hasText(cfg.url)) {
      link.href = cfg.url;
      link.textContent = firstText(cfg.boton, "Ver pase digital");
      setVisible(link, true);
    } else if (link) {
      link.removeAttribute("href");
      link.textContent = "";
      setVisible(link, false);
    }

    setVisible(section, true);
  }

  function renderPassIcon(cfg) {
    const body = document.querySelector("#pases .pases-body") || document.querySelector("#pases .qr-fotos-body");
    const title = document.getElementById("pases-title");
    if (!body || !title) return;

    const src = firstText(document.body?.dataset?.paseIcon, cfg.icono, cfg.icon, cfg.imagenIcono, DEFAULT_PASS_ICON);
    let icon = document.getElementById("pases-icon");
    if (!hasText(src)) {
      if (icon) icon.remove();
      return;
    }

    if (!icon) {
      icon = document.createElement("img");
      icon.id = "pases-icon";
      icon.className = "pases-icon";
      icon.alt = "";
      icon.loading = "eager";
      icon.decoding = "async";
      body.insertBefore(icon, title);
    }

    icon.src = src;
    icon.setAttribute("aria-hidden", "true");
  }

  function getDatasetPassQuantity() {
    const dataset = document.body?.dataset || {};
    const values = [
      dataset.paseCantidad,
      dataset.pasePersonas,
      extractNumber(dataset.paseLabel),
      extractNumber(dataset.paseEntrada)
    ];
    return values
      .map((value) => Number(String(value || "").trim()))
      .find((value) => Number.isFinite(value) && value > 0) || 0;
  }

  function getDatasetPassLabel(quantity) {
    const dataset = document.body?.dataset || {};
    return firstText(
      dataset.paseLabel,
      quantity > 0 ? `Pase para ${quantity} ${quantity === 1 ? "persona" : "personas"}` : ""
    );
  }

  function renderPassQuantityTitle(quantity, label) {
    const title = document.getElementById("pases-title");
    if (!title) return;

    title.classList.add("pases-title--cantidad");
    title.setAttribute("aria-label", label);
    title.replaceChildren(
      makeSpan("pase-title-prefix", "Pase para"),
      makeSpan("pase-number", String(quantity)),
      makeSpan("pase-personas", quantity === 1 ? "persona" : "personas")
    );
  }

  function makeSpan(className, text) {
    const node = document.createElement("span");
    node.className = className;
    node.textContent = text;
    return node;
  }

  function extractNumber(value) {
    const match = String(value || "").match(/(\d+)/);
    return match ? match[1] : "";
  }

  function applySectionAliases(config) {
    const raw = config.__rawConfig || {};
    const sections = raw.secciones || config.secciones || {};

    if (sections.informacion === false || sections.notas === false) {
      hideSelectors(["#informacion", "#notas"]);
    }

    if (sections.buzon === false) {
      hideSelectors(["#buzon", ".detalle-card--buzon"]);
    }

    if (sections.confirmacion === false || raw.confirmacion?.activo === false || config.confirmacion?.activo === false) {
      hideSelectors(["#confirmacion"]);
    }
  }

  function clearQr(section, prefix) {
    [`${prefix}-eyebrow`, `${prefix}-title`, `${prefix}-text`, `${prefix}-link`].forEach((id) => setText(id, ""));
    const image = document.getElementById(`${prefix}-image`);
    if (image) {
      image.removeAttribute("src");
      image.removeAttribute("alt");
    }
    const link = document.getElementById(`${prefix}-link`);
    if (link) link.removeAttribute("href");
    setVisible(document.getElementById(`${prefix}-media`), false);
    setVisible(section, false);
  }

  function clearPases() {
    ["pases-eyebrow", "pases-title", "pases-text", "pases-link"].forEach((id) => setText(id, ""));
    document.getElementById("pases-icon")?.remove();
    const link = document.getElementById("pases-link");
    if (link) {
      link.removeAttribute("href");
      setVisible(link, false);
    }
  }

  function hideSelectors(selectors) {
    selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((node) => setVisible(node, false));
    });
  }

  function setVisible(node, visible) {
    if (!node) return;
    node.hidden = !visible;
    node.classList.toggle(HIDDEN_CLASS, !visible);
    if (visible) node.removeAttribute("aria-hidden");
    else node.setAttribute("aria-hidden", "true");
  }

  function setText(id, value) {
    const node = document.getElementById(id);
    if (node) node.textContent = hasText(value) ? String(value).trim() : "";
  }

  function firstText(...values) {
    const value = values.find(hasText);
    return hasText(value) ? String(value).trim() : "";
  }

  function firstObject(...values) {
    return values.find((value) => value && typeof value === "object" && !Array.isArray(value)) || {};
  }

  function hasText(value) {
    return typeof value === "string" && value.trim().length > 0;
  }

  function injectStyles() {
    if (document.getElementById("qr-fotos-shared-style")) return;
    const style = document.createElement("style");
    style.id = "qr-fotos-shared-style";
    style.textContent = `
      .qr-fotos-section {
        max-width: min(100%, var(--ancho-contenido, var(--wlv-control-ancho-mobile, 430px)));
        margin-inline: auto;
        padding: var(--panel-padding, 2rem 1.2rem);
        border: 1px solid var(--color-linea, rgba(255, 255, 255, .28));
        border-radius: var(--borde-panel, 24px);
        background: var(--color-panel, rgba(255, 255, 255, .08));
        box-shadow: var(--sombra-magica, 0 18px 42px rgba(0, 0, 0, .18));
        backdrop-filter: blur(8px);
        text-align: center;
      }

      .qr-fotos-card {
        display: grid;
        justify-items: center;
        gap: clamp(.85rem, 3vw, 1.35rem);
        max-width: min(100%, 430px);
        margin-inline: auto;
      }

      .qr-fotos-media {
        width: clamp(132px, 42vw, 220px);
        margin: 0;
        padding: .72rem;
        border: 1px solid color-mix(in srgb, currentColor 28%, transparent);
        border-radius: 18px;
        background: color-mix(in srgb, white 88%, transparent);
        box-shadow: 0 16px 42px rgba(0, 0, 0, .22);
      }

      .qr-fotos-media img {
        display: block;
        width: 100%;
        height: auto;
        object-fit: contain;
        border-radius: 10px;
      }

      .qr-fotos-body {
        display: grid;
        justify-items: center;
        gap: .65rem;
      }

      .qr-fotos-body h2,
      #qr-fotos-title {
        margin-bottom: 0;
      }

      #qr-fotos-text {
        max-width: 28rem;
        margin: 0;
        line-height: 1.5;
      }

      .pases-icon {
        display: block;
        width: clamp(74px, 22vw, 112px);
        height: clamp(74px, 22vw, 112px);
        object-fit: contain;
        margin: 0 auto .15rem;
        filter: drop-shadow(0 10px 16px rgba(123, 77, 26, .26));
      }

      .qr-fotos-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: fit-content;
        max-width: 100%;
        min-height: 42px;
        padding: .72rem 1rem;
        border-radius: 999px;
        text-decoration: none;
        white-space: normal;
      }
    `;
    document.head.appendChild(style);
  }
})();
;
/* === maine321.js === */
// MARK: MOTOR-CUENTO
// Orquesta secciones separadas. No contiene datos ni estilos.
(() => {
  "use strict";

  const ns = window.DemoInvitacion = window.DemoInvitacion || {};
  const params = new URLSearchParams(window.location.search);

  const defaultSections = {
    hero: true,
    heroFoto: true,
    fecha: true,
    mensaje: true,
    fotoDestacada: true,
    familia: true,
    ubicaciones: true,
    itinerario: true,
    regalos: true,
    vestimenta: true,
    notas: true,
    galeria: true,
    confirmacion: true,
    final: true
  };

  const sectionTargets = {
    hero: ["#inicio"],
    heroFoto: [".portrait-frame"],
    fecha: ["#fecha", "#hero-date"],
    fotoDestacada: ["#recuerdo"],
    familia: ["#familia"],
    ubicaciones: ["#ubicaciones"],
    itinerario: ["#itinerario"],
    regalos: ["#detalles"],
    vestimenta: ["#vestimenta"],
    notas: ["#notas"],
    galeria: ["#galeria"],
    confirmacion: ["#confirmacion"],
    final: ["#cierre"]
  };

  ns.state = ns.state || {};
  ns.state.preview = params.get("preview") === "1";

  document.addEventListener("DOMContentLoaded", start);

  async function start() {
    try {
      const rawData = await loadRawSource();
      const data = normalizeLocalData(await ns.datos.loadConfig(), rawData);
      const renderData = prepareRenderData(data);
      const paintData = withRendererLabels(renderData);
      ns.state.config = renderData;

      ns.tema.apply(renderData);
      applyMetaFromJson(renderData);
      ns.overlay.setup(renderData);
      ns.musica.setup(renderData);
      ns.secciones.renderAll(paintData);
      setupLocalLightbox();
      ns.secciones.reloj?.render?.(renderData);
      applyHeroDate(renderData);
      applyFormData(renderData);
      applyCredit(renderData);
      const visibility = applySectionVisibility(renderData);
      ns.tema.afterSections(renderData);
      ns.reveal.setup();
      setupCountdownSunReveal();
      setupQuickNavReveal();
      setupAutoScroll(renderData);
      window.dispatchEvent(new CustomEvent("demo:ready", { detail: { ...renderData, __visibility: visibility } }));
    } catch (error) {
      console.error(error);
      document.body.classList.add("data-error");
    }
  }

  async function loadRawSource() {
    // Try inline <script id="invita-inline-data"> first (works on file://)
    try {
      const el = document.getElementById("invita-inline-data");
      if (el && el.textContent.trim()) return JSON.parse(el.textContent);
    } catch (_) {}

    const jsonPath = document.body.dataset.demoJson || "objeto-xv.json?cache=88";
    try {
      const response = await fetch((jsonPath.includes("?") ? jsonPath : `${jsonPath}?cache=88`), { cache: "no-store" });
      if (!response.ok) return null;
      return response.json();
    } catch (error) {
      console.warn("MARK: DATOS-CUENTO-LOCAL", error);
      return null;
    }
  }

  function normalizeLocalData(data = {}, rawData = data) {
    const pageConfig = readPageConfigFromHtml();
    const raw = mergePageConfig(rawData || data || {}, pageConfig);
    const copy = mergePageConfig(cloneData(data || {}), pageConfig);
    const imagenes = normalizeImages(raw, copy);

    copy.__rawConfig = raw;
    copy.respuestaFotos = raw.respuestaFotos !== false;
    copy.labels = { ...(raw.labels || {}) };
    copy.formulario = { ...(raw.formulario || {}) };
    copy.secciones = normalizeSections(raw.secciones);
    copy.imagenes = imagenes;
    copy.hero = {
      ...(copy.hero || {}),
      foto: imagenes.portada,
      fotoAlt: imagenes.portadaAlt
    };
    copy.memory = {
      ...(copy.memory || {}),
      src: imagenes.destacada,
      alt: imagenes.destacadaAlt,
      texto: imagenes.destacadaTexto,
      gradient: imagenes.destacadaGradient !== false
    };
    copy.galeria = imagenes.galeria;
    copy.navegacion = {
      ...(copy.navegacion || {}),
      familia: copy.labels.navFamilia ?? copy.navegacion?.familia,
      ubicaciones: copy.labels.navUbicaciones ?? copy.navegacion?.ubicaciones,
      confirmacion: copy.labels.navConfirmacion ?? copy.navegacion?.confirmacion
    };
    copy.ubicaciones = normalizeLocations(raw.ubicaciones || copy.ubicaciones);
    copy.confirmacion = normalizeConfirmation(copy.confirmacion, copy.formulario);
    return copy;
  }

  function normalizeImages(raw, data) {
    const imagenes = raw?.imagenes || data?.imagenes || {};
    return {
      portada: firstText(imagenes.portada, data?.hero?.foto),
      portadaAlt: firstText(imagenes.portadaAlt, data?.hero?.fotoAlt),
      destacada: firstText(imagenes.destacada, data?.memory?.src),
      destacadaAlt: firstText(imagenes.destacadaAlt, data?.memory?.alt),
      destacadaTexto: firstText(imagenes.destacadaTexto, data?.memory?.texto),
      destacadaGradient: imagenes.destacadaGradient ?? data?.memory?.gradient,
      galeria: normalizeGallery(imagenes.galeria || data?.galeria)
    };
  }

  function normalizeSections(secciones = {}) {
    const result = { ...defaultSections };
    if (!secciones || typeof secciones !== "object") return result;
    Object.keys(result).forEach((key) => {
      if (typeof secciones[key] === "boolean") result[key] = secciones[key];
    });
    return result;
  }

  function normalizeGallery(items) {
    if (!Array.isArray(items)) return [];
    return items.map((item, index) => {
      if (typeof item === "string") return { src: item, alt: `Foto ${index + 1}` };
      return { src: firstText(item?.src, item?.foto, item?.url), alt: firstText(item?.alt, `Foto ${index + 1}`) };
    }).filter((item) => hasText(item.src));
  }

  function normalizeLocations(items) {
    if (!Array.isArray(items)) return [];
    return items.map((item, index) => {
      const tipo = normalizeTipo(item?.tipo, index);
      const titulo = firstText(item?.titulo, item?.tipo, tipo === "ceremonia" ? "Ceremonia" : "Recepción");
      return {
        ...item,
        tipo,
        titulo,
        activo: item?.activo !== false
      };
    }).filter((item) => item.activo !== false && (hasText(item.titulo) || hasText(item.lugar) || hasText(item.url)));
  }

  function normalizeTipo(value, index) {
    const text = String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (text.includes("ceremon") || index === 0) return "ceremonia";
    return "evento";
  }

  function normalizeConfirmation(confirmacion = {}, formulario = {}) {
    return {
      ...confirmacion,
      nombrePlaceholder: confirmacion.nombrePlaceholder || formulario.nombrePlaceholder,
      invitadosLabel: confirmacion.invitadosLabel || formulario.invitadosLabel,
      mensajePlaceholder: confirmacion.mensajePlaceholder || formulario.mensajePlaceholder,
      boton: confirmacion.boton || formulario.botonConfirmacion
    };
  }

  function prepareRenderData(data) {
    const copy = cloneData(data);
    if (!sectionActive(copy, "heroFoto")) {
      copy.hero = { ...(copy.hero || {}), foto: "" };
    }
    if (!sectionActive(copy, "fotoDestacada")) {
      copy.memory = { ...(copy.memory || {}), src: "" };
    }
    if (!sectionActive(copy, "galeria")) {
      copy.galeria = [];
    }
    if (!sectionActive(copy, "ubicaciones")) {
      copy.ubicaciones = [];
    }
    return copy;
  }

  function withRendererLabels(data) {
    return {
      ...data,
      secciones: {
        ...data.secciones,
        ...(data.labels || {})
      },
      ubicaciones: data.ubicaciones.map((item) => ({
        ...item,
        tipo: item.titulo || (item.tipo === "ceremonia" ? "Ceremonia" : "Recepción")
      }))
    };
  }

  function applyMetaFromJson(data) {
    const meta = data.meta || {};
    const description = firstText(meta.descripcion, data.hero?.frase, meta.titulo);
    setHeadText("title", firstText(meta.titulo, data.hero?.nombre, "Invitación XV"));
    setMetaContent("meta-description", description);
    setMetaContent("meta-theme-color", meta.themeColor);
    setMetaContent("og-title", firstText(meta.titulo, data.hero?.nombre));
    setMetaContent("og-description", description);
    setMetaContent("og-image", firstText(meta.imagen, data.imagenes?.portada));
    setMetaContent("og-image-secure-url", firstText(meta.imagenSecureUrl, meta.imagen));
    setMetaContent("og-image-type", meta.imagenTipo);
    setMetaContent("og-image-width", meta.imagenAncho);
    setMetaContent("og-image-height", meta.imagenAlto);
    setMetaContent("og-url", firstText(meta.url, meta.canonical));
    setMetaContent("twitter-title", firstText(meta.twitterTitulo, meta.titulo));
    setMetaContent("twitter-description", firstText(meta.twitterDescripcion, description));
    setMetaContent("twitter-image", firstText(meta.twitterImagen, meta.imagen));
    setMetaContent("twitter-card", firstText(meta.twitterCard, "summary_large_image"));
    setHref("canonical-link", firstText(meta.canonical, meta.url));
    setHref("favicon-link", meta.favicon);
  }

  function applyFormData(data) {
    const formulario = data.formulario || {};
    setAttr("rsvp-nombre", "placeholder", formulario.nombrePlaceholder);
    setAttr("rsvp-nombre", "aria-label", firstText(formulario.nombreAriaLabel, formulario.nombrePlaceholder));
    setAttr("rsvp-invitados", "aria-label", firstText(formulario.invitadosAriaLabel, formulario.invitadosLabel));
    setAttr("rsvp-invitados", "min", formulario.invitadosMin);
    setAttr("rsvp-invitados", "max", formulario.invitadosMax);
    if (hasText(formulario.invitadosDefault)) {
      const guests = document.getElementById("rsvp-invitados");
      if (guests && !guests.value) guests.value = formulario.invitadosDefault;
    }
    setAttr("rsvp-mensaje", "placeholder", formulario.mensajePlaceholder);
    setAttr("rsvp-mensaje", "aria-label", firstText(formulario.mensajeAriaLabel, formulario.mensajePlaceholder));
  }

  function applyHeroDate(data) {
    const weekday = ns.fecha?.getWeekday?.(data) || "";
    ns.helpers?.setText?.("date-weekday", weekday);
  }

  function applyCredit(data) {
    const contacto = data.contacto || {};
    setHref("pistache-credit-link", contacto.url);
    setText("pistache-credit-text", contacto.texto);
    setText("pistache-credit-brand", contacto.marca);
  }

  function applySectionVisibility(data) {
    const visibility = {};
    Object.keys(sectionTargets).forEach((key) => {
      const visible = sectionActive(data, key);
      visibility[key] = visible;
      sectionTargets[key].forEach((selector) => {
        document.querySelectorAll(selector).forEach((node) => setVisible(node, visible));
      });
    });

    if (!visibility.heroFoto) cleanHeroPhoto();
    if (!visibility.fotoDestacada) cleanFeaturedPhoto();
    if (!visibility.galeria) cleanGallery();
    if (!visibility.ubicaciones) cleanLocations();
    updateNavigation(visibility);
    return visibility;
  }

  function sectionActive(data, key) {
    if (data?.secciones?.[key] === false) return false;
    switch (key) {
      case "hero":
        return true;
      case "heroFoto":
        return collectPhotoSources([data?.imagenes?.portada, data?.hero?.foto]).length > 0;
      case "fecha":
        return Boolean(data?.fecha || data?.reloj);
      case "fotoDestacada":
        return data?.respuestaFotos !== false && collectPhotoSources([data?.imagenes?.destacada, data?.memory?.src]).length > 0;
      case "familia":
        return Array.isArray(data?.familia) && data.familia.some((group) => group?.activo !== false && collectTextSources(group?.nombres).length > 0);
      case "ubicaciones":
        return Array.isArray(data?.ubicaciones) && data.ubicaciones.length > 0;
      case "itinerario":
        return Array.isArray(data?.itinerario) && data.itinerario.length > 0;
      case "regalos":
        return hasDetails(data?.detalles);
      case "vestimenta":
        return Boolean(data?.vestimenta && (hasText(data.vestimenta.titulo) || hasText(data.vestimenta.texto) || hasText(data.vestimenta.media)));
      case "notas":
        return Array.isArray(data?.notas) && data.notas.length > 0;
      case "galeria":
        return data?.respuestaFotos !== false && collectPhotoSources(data?.galeria || data?.imagenes?.galeria).length > 0;
      case "confirmacion":
        return Boolean(data?.confirmacion && (hasText(data.confirmacion.telefono) || hasText(data.confirmacion.whatsapp?.numero)));
      case "final":
        return Boolean(data?.cierre && (hasText(data.cierre.nota) || hasText(data.cierre.titulo)));
      default:
        return true;
    }
  }

  function hasDetails(detalles) {
    if (Array.isArray(detalles)) return detalles.length > 0;
    if (!detalles || typeof detalles !== "object") return false;
    return Object.values(detalles).some((item) => item && typeof item === "object" && item.activo !== false);
  }

  function collectPhotoSources(value) {
    const sources = [];
    const add = (item) => {
      if (!item) return;
      if (Array.isArray(item)) {
        item.forEach(add);
        return;
      }
      if (typeof item === "object") {
        add(item.src || item.url || item.foto || item.imagen);
        return;
      }
      const text = String(item).trim();
      if (text) sources.push(text);
    };
    add(value);
    return sources;
  }

  function collectTextSources(value) {
    const sources = [];
    const add = (item) => {
      if (!item) return;
      if (Array.isArray(item)) {
        item.forEach(add);
        return;
      }
      if (typeof item === "object") {
        Object.values(item).forEach(add);
        return;
      }
      const text = String(item).trim();
      if (text) sources.push(text);
    };
    add(value);
    return sources;
  }

  function setVisible(node, visible) {
    if (!node || ns.state.preview) return;
    node.hidden = !visible;
    node.classList.toggle("esconder", !visible);
    if (visible) node.removeAttribute("aria-hidden");
    else node.setAttribute("aria-hidden", "true");
  }

  function cleanHeroPhoto() {
    const img = document.getElementById("foto-portada");
    if (!img) return;
    img.removeAttribute("src");
    img.removeAttribute("srcset");
  }

  function cleanFeaturedPhoto() {
    const img = document.getElementById("foto-destacada");
    if (img) {
      img.removeAttribute("src");
      img.removeAttribute("srcset");
    }
    const text = document.getElementById("memory-text");
    if (text) text.textContent = "";
  }

  function cleanGallery() {
    ns.state.galleryItems = [];
    const list = document.getElementById("galeria-lista");
    if (list) list.innerHTML = "";
    const lightbox = document.getElementById("lightbox");
    if (lightbox) lightbox.hidden = true;
  }

  function setupLocalLightbox() {
    const lightbox = document.getElementById("lightbox");
    const image = document.getElementById("lightbox-image");
    const grid = document.getElementById("galeria-lista");
    if (!lightbox || !image || !grid || ns.lightbox?.__localReady) return;

    const normalizeItems = (items = ns.state.galleryItems || []) => items.map((item) => {
      if (typeof item === "string") return { src: item, alt: "" };
      return { src: item?.src || "", alt: item?.alt || "" };
    }).filter((item) => item.src);

    const open = (index = 0, items) => {
      const source = normalizeItems(items);
      if (!source.length) return;
      ns.state.galleryItems = source;
      ns.state.galleryIndex = (index + source.length) % source.length;
      const current = source[ns.state.galleryIndex];
      image.src = current.src;
      image.alt = current.alt || "";
      lightbox.hidden = false;
      document.body.classList.add("lightbox-open");
    };

    const close = () => {
      lightbox.hidden = true;
      image.removeAttribute("src");
      image.removeAttribute("alt");
      document.body.classList.remove("lightbox-open");
    };

    grid.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-gallery-index]");
      if (!trigger) return;
      open(Number(trigger.dataset.galleryIndex || 0));
    });
    document.getElementById("lightbox-close")?.addEventListener("click", close);
    document.getElementById("lightbox-prev")?.addEventListener("click", () => open((ns.state.galleryIndex || 0) - 1));
    document.getElementById("lightbox-next")?.addEventListener("click", () => open((ns.state.galleryIndex || 0) + 1));
    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) close();
    });

    ns.lightbox = { ...(ns.lightbox || {}), __localReady: true, setup: setupLocalLightbox, open, close };
  }

  function setupCountdownSunReveal() {
    const sun = document.querySelector(".decor-layer .float-sun");
    const countdown = document.getElementById("fecha");
    const hero = document.getElementById("inicio");
    if (!sun || !countdown || !hero || countdown.hidden) return;

    let countdownReached = false;
    let heroInView = true;
    let invitationOpen = document.body.classList.contains("is-open");

    const updateSunVisibility = () => {
      sun.classList.toggle("is-countdown-visible", invitationOpen && countdownReached && !heroInView);
    };

    window.addEventListener("invitacionAbierta", () => {
      invitationOpen = true;
      updateSunVisibility();
    }, { once: true });

    if (!("IntersectionObserver" in window)) {
      const updateFromScroll = () => {
        const heroRect = hero.getBoundingClientRect();
        const countdownRect = countdown.getBoundingClientRect();
        heroInView = heroRect.bottom > 0 && heroRect.top < window.innerHeight;
        if (countdownRect.top < window.innerHeight * 0.82) countdownReached = true;
        updateSunVisibility();
      };
      window.addEventListener("scroll", updateFromScroll, { passive: true });
      updateFromScroll();
      return;
    }

    const heroObserver = new IntersectionObserver((entries) => {
      heroInView = entries.some((entry) => entry.isIntersecting);
      updateSunVisibility();
    }, { threshold: 0 });

    const countdownObserver = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      countdownReached = true;
      updateSunVisibility();
      countdownObserver.disconnect();
    }, {
      threshold: 0.18,
      rootMargin: "0px 0px -12% 0px"
    });

    heroObserver.observe(hero);
    countdownObserver.observe(countdown);
  }

  function setupQuickNavReveal() {
    const nav = document.querySelector(".quick-nav");
    if (!nav) return;

    let invitationOpen = document.body.classList.contains("is-open");
    let navInView = false;
    let revealed = false;
    let observer;

    const revealWhenReady = () => {
      if (revealed || !invitationOpen || !navInView) return;
      revealed = true;
      nav.classList.add("is-in-view");
      observer?.disconnect();
      window.removeEventListener("invitacionAbierta", handleInvitationOpen);
    };

    const handleInvitationOpen = () => {
      invitationOpen = true;
      revealWhenReady();
    };

    window.addEventListener("invitacionAbierta", handleInvitationOpen);

    if (!("IntersectionObserver" in window)) {
      navInView = true;
      revealWhenReady();
      return;
    }

    observer = new IntersectionObserver((entries) => {
      navInView = entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.65);
      revealWhenReady();
    }, {
      threshold: 0.65,
      rootMargin: "0px 0px -6% 0px"
    });

    observer.observe(nav);
  }

  function cleanLocations() {
    const list = document.getElementById("ubicaciones-lista");
    if (list) list.innerHTML = "";
  }

  function setupAutoScroll(data) {
    const options = data?.autoScroll || data?.__rawConfig?.autoScroll || {};
    if (options.activo !== true || ns.state.capture) return;

    const root = () => document.scrollingElement || document.documentElement;
    const top = () => window.scrollY || root().scrollTop || 0;
    const max = () => Math.max(0, root().scrollHeight - innerHeight);
    const speed = Number.isFinite(options.velocidad) ? options.velocidad : 0.75;
    const delay = Number.isFinite(options.inicioMs) ? options.inicioMs : 900;
    const resumeDelay = Number.isFinite(options.reanudarMs) ? options.reanudarMs : 3600;
    let active = false;
    let paused = true;
    let touching = false;
    let target = 0;
    let timer = 0;
    let resume = 0;
    let waitingBottom = false;
    let lastLimit = 0;
    let resizeObserver = null;

    const stop = () => {
      if (timer) clearInterval(timer);
      timer = 0;
    };

    const showNotice = () => {
      if (options.aviso === false || document.querySelector(".auto-scroll-notice")) return;
      const notice = document.createElement("p");
      notice.className = "auto-scroll-notice";
      notice.setAttribute("role", "status");
      notice.textContent = "La invitación avanzará automáticamente. Toca la pantalla para pausarla.";
      document.body.append(notice);
      requestAnimationFrame(() => notice.classList.add("is-visible"));
      setTimeout(() => {
        notice.classList.remove("is-visible");
        setTimeout(() => notice.remove(), 260);
      }, 4600);
    };

    const blocked = () => touching
      || document.hidden
      || document.body.classList.contains("lightbox-open")
      || document.activeElement?.matches?.("input, textarea, select, [contenteditable='true']");

    const pause = (ms = resumeDelay) => {
      if (!active) return;
      paused = true;
      waitingBottom = false;
      stop();
      clearTimeout(resume);
      if (ms) resume = setTimeout(play, ms);
    };

    const waitForGrowingContent = () => {
      paused = true;
      waitingBottom = true;
      lastLimit = max();
      stop();
      clearTimeout(resume);
      resume = setTimeout(() => {
        if (waitingBottom && max() > lastLimit + 8) play();
      }, 1200);
    };

    const maybeResumeAfterGrowth = () => {
      if (!active || !waitingBottom || blocked()) return;
      if (max() <= lastLimit + 8) return;
      waitingBottom = false;
      target = top();
      play();
    };

    const tick = () => {
      if (!active || paused || blocked()) {
        stop();
        return;
      }
      if (Math.abs(top() - target) > 2) target = top();
      const limit = max();
      if (target >= limit - 2) {
        waitForGrowingContent();
        return;
      }
      const next = Math.ceil(target = Math.min(limit, target + speed));
      document.documentElement.scrollTop = next;
      document.body.scrollTop = next;
      scrollTo(0, next);
    };

    function play() {
      if (!active || blocked()) {
        pause(900);
        return;
      }
      waitingBottom = false;
      paused = false;
      target = top();
      document.documentElement.style.scrollBehavior = "auto";
      if (!timer) timer = setInterval(tick, 16);
    }

    const start = () => {
      if (active) return;
      active = true;
      showNotice();
      document.activeElement?.blur?.();
      if ("ResizeObserver" in window) {
        resizeObserver = new ResizeObserver(maybeResumeAfterGrowth);
        resizeObserver.observe(document.body);
      }
      document.addEventListener("load", maybeResumeAfterGrowth, true);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        target = top();
        setTimeout(play, delay);
      }));
    };

    const down = () => {
      touching = true;
      paused = true;
      stop();
      clearTimeout(resume);
    };
    const up = () => {
      touching = false;
      pause();
    };

    ["touchstart", "pointerdown"].forEach((name) => addEventListener(name, down, { passive: true }));
    ["touchend", "pointerup", "pointercancel"].forEach((name) => addEventListener(name, up, { passive: true }));
    ["wheel", "keydown"].forEach((name) => addEventListener(name, () => pause(), { passive: true }));
    addEventListener("blur", () => pause(0));
    document.addEventListener("visibilitychange", () => document.hidden ? pause(0) : pause(900));
    addEventListener("invitacionAbierta", start, { once: true });
    if (document.body.classList.contains("is-open")) start();
  }

  function updateNavigation(visibility) {
    setVisible(document.getElementById("nav-familia"), visibility.familia);
    setVisible(document.getElementById("nav-ubicaciones"), visibility.ubicaciones);
    setVisible(document.getElementById("nav-confirmacion"), visibility.confirmacion);
  }

  function cloneData(data) {
    if (typeof structuredClone === "function") return structuredClone(data);
    return JSON.parse(JSON.stringify(data));
  }

  function setText(id, value = "") {
    const node = document.getElementById(id);
    if (node) node.textContent = value || "";
  }

  function setMetaContent(id, value) {
    setAttr(id, "content", value);
  }

  function setHref(id, value) {
    setAttr(id, "href", value);
  }

  function setAttr(id, attr, value) {
    const node = document.getElementById(id);
    if (!node) return;
    if (!hasText(value)) node.removeAttribute(attr);
    else node.setAttribute(attr, value);
  }

  function setHeadText(selector, value) {
    const node = document.head.querySelector(selector);
    if (node) node.textContent = value || "";
  }

  function firstText(...values) {
    const value = values.find((item) => hasText(item));
    return hasText(value) ? String(value).trim() : "";
  }

  function hasText(value) {
    return typeof value === "string" && value.trim().length > 0;
  }

  function readPageConfigFromHtml() {
    const body = document.body || {};
    const dataset = body.dataset || {};
    const metaContent = (id) => document.getElementById(id)?.getAttribute("content") || "";
    const linkHref = (id) => document.getElementById(id)?.getAttribute("href") || "";
    const title = document.querySelector("title")?.textContent?.trim() || "";
    const meta = {
      titulo: title,
      descripcion: metaContent("meta-description"),
      themeColor: metaContent("meta-theme-color"),
      imagen: metaContent("og-image"),
      imagenSecureUrl: metaContent("og-image-secure-url"),
      imagenTipo: metaContent("og-image-type"),
      imagenAncho: metaContent("og-image-width"),
      imagenAlto: metaContent("og-image-height"),
      url: metaContent("og-url"),
      canonical: linkHref("canonical-link"),
      twitterTitulo: metaContent("twitter-title"),
      twitterDescripcion: metaContent("twitter-description"),
      twitterImagen: metaContent("twitter-image"),
      twitterCard: metaContent("twitter-card"),
      favicon: linkHref("favicon-link") || linkHref("page-favicon")
    };

    return {
      tipoEvento: dataset.tipoEvento || "",
      tituloEvento: dataset.tituloEvento || "",
      nombre: dataset.nombre || "",
      numeroEvento: dataset.numeroEvento || "",
      respuestaFotos: dataset.respuestaFotos !== "false",
      meta,
      metaDescripcion: meta.descripcion
    };
  }

  function mergePageConfig(data, pageConfig = readPageConfigFromHtml()) {
    return {
      ...(data || {}),
      ...pageConfig,
      meta: pageConfig.meta,
      metaDescripcion: pageConfig.meta.descripcion
    };
  }

})();
;