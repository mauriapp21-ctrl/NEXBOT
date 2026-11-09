/*
 * Injected into recorded pages by the RPA Studio local engine (plain JS, no
 * build step). Reports real user interactions through the __rpaRecord binding
 * with a Playwright-compatible selector and a human label.
 */
(function rpaRecorder() {
  const w = window;
  if (w.__rpaRecorderInstalled) return;
  w.__rpaRecorderInstalled = true;

  const lastValue = new WeakMap();
  const cssEscape = (value) => (window.CSS?.escape ? CSS.escape(value) : value.replace(/["\\]/g, "\\$&"));
  const unique = (selector) => {
    try {
      return document.querySelectorAll(selector).length === 1;
    } catch {
      return false;
    }
  };
  const textOf = (el) => ((el).innerText || el.textContent || "").replace(/\s+/g, " ").trim();

  // Text of a <label> without the text of the controls it wraps (e.g. options).
  function ownLabelText(label) {
    const clone = label.cloneNode(true);
    clone.querySelectorAll("select, input, textarea, button, datalist").forEach((node) => node.remove());
    return (clone.textContent || "").replace(/\s+/g, " ").trim();
  }

  function labelFor(el) {
    const aria = el.getAttribute("aria-label");
    if (aria) return aria.trim();
    const id = el.getAttribute("id");
    if (id) {
      const label = document.querySelector(`label[for="${cssEscape(id)}"]`);
      if (label && ownLabelText(label)) return ownLabelText(label);
    }
    const wrapping = el.closest("label");
    if (wrapping && ownLabelText(wrapping)) return ownLabelText(wrapping).slice(0, 60);
    const placeholder = el.getAttribute("placeholder");
    if (placeholder) return placeholder;
    const text = textOf(el);
    if (text) return text.slice(0, 60);
    return el.getAttribute("name") || el.getAttribute("title") || el.tagName.toLowerCase();
  }

  function roleOf(el) {
    const explicit = el.getAttribute("role");
    if (explicit) return explicit;
    const tag = el.tagName.toLowerCase();
    if (tag === "button") return "button";
    if (tag === "a" && el.hasAttribute("href")) return "link";
    if (tag === "input") {
      const type = (el).type;
      if (["submit", "button", "reset"].includes(type)) return "button";
    }
    return null;
  }

  function cssPath(el) {
    const parts = [];
    let node = el;
    while (node && node !== document.body && parts.length < 5) {
      const current = node;
      if (current.id && /^[a-zA-Z][\w-]*$/.test(current.id)) {
        parts.unshift(`#${current.id}`);
        break;
      }
      const tag = current.tagName.toLowerCase();
      const siblings = current.parentElement
        ? Array.from(current.parentElement.children).filter((c) => c.tagName === current.tagName)
        : [];
      parts.unshift(siblings.length > 1 ? `${tag}:nth-of-type(${siblings.indexOf(current) + 1})` : tag);
      node = current.parentElement;
    }
    return parts.join(" > ");
  }

  /** Most stable selector first: test ids, ids, names, role + name, CSS path. */
  function selectorFor(el) {
    for (const attr of ["data-testid", "data-test", "data-qa"]) {
      const value = el.getAttribute(attr);
      if (value && unique(`[${attr}="${cssEscape(value)}"]`)) return `[${attr}="${value}"]`;
    }
    const id = el.getAttribute("id");
    if (id && /^[a-zA-Z][\w-]*$/.test(id) && !/\d{4,}/.test(id) && unique(`#${cssEscape(id)}`)) return `#${id}`;
    const tag = el.tagName.toLowerCase();
    const name = el.getAttribute("name");
    if (name && unique(`${tag}[name="${cssEscape(name)}"]`)) return `${tag}[name="${name}"]`;
    const role = roleOf(el);
    const accessible = el.getAttribute("aria-label") || (tag === "input" ? (el).value : textOf(el));
    if (role && accessible && accessible.length <= 50) return `role=${role}[name="${accessible.replace(/"/g, '\\"')}"]`;
    const placeholder = el.getAttribute("placeholder");
    if (placeholder && unique(`${tag}[placeholder="${cssEscape(placeholder)}"]`)) return `${tag}[placeholder="${placeholder}"]`;
    return cssPath(el);
  }

  const send = (payload) => w.__rpaRecord?.(payload);
  const isTextField = (el) =>
    el instanceof HTMLTextAreaElement ||
    (el instanceof HTMLInputElement &&
      ["text", "email", "password", "search", "tel", "url", "number", "date", "datetime-local", "time", "month", "week", ""].includes(el.type));

  function flushText(el) {
    const input = el;
    if (lastValue.get(el) === input.value) return;
    lastValue.set(el, input.value);
    const secret = input.type === "password";
    // Password values never leave the page: only the fact that one was typed.
    send({ kind: "type", selector: selectorFor(el), label: labelFor(el), value: secret ? "" : input.value, secret });
  }

  document.addEventListener(
    "click",
    (event) => {
      const raw = event.target;
      if (!raw || !(raw instanceof Element)) return;
      if (isTextField(raw) || raw instanceof HTMLSelectElement || (raw instanceof HTMLInputElement && raw.type === "file")) return;
      let target = raw.closest(
        "button, a[href], [role=button], [role=link], [role=tab], [role=menuitem], [role=option], [role=checkbox], [role=radio], input[type=submit], input[type=button], input[type=checkbox], input[type=radio], label, summary",
      );
      if (target instanceof HTMLLabelElement) {
        const control = target.control;
        // A label of a text field, select or file input only moves the focus;
        // what the user types/selects is recorded on the control itself.
        if (!control || isTextField(control) || control instanceof HTMLSelectElement || (control instanceof HTMLInputElement && control.type === "file")) return;
        // Checkbox/radio labels: record the click on the control (more stable selector).
        target = control;
      }
      if (!target) {
        // Generic elements count only when they look clickable (cursor: pointer);
        // clicks on empty areas, text or the page background are ignored.
        if (raw === document.documentElement || raw === document.body) return;
        if (getComputedStyle(raw).cursor !== "pointer") return;
        target = raw;
      }
      send({ kind: "click", selector: selectorFor(target), label: labelFor(target) });
    },
    true,
  );

  document.addEventListener(
    "change",
    (event) => {
      const el = event.target;
      if (!el) return;
      if (isTextField(el)) flushText(el);
      else if (el instanceof HTMLSelectElement) {
        send({ kind: "select", selector: selectorFor(el), label: labelFor(el), value: el.selectedOptions[0]?.text.trim() ?? el.value });
      } else if (el instanceof HTMLInputElement && el.type === "file") {
        const names = Array.from(el.files ?? []).map((f) => f.name).join(", ");
        send({ kind: "upload", selector: selectorFor(el), label: labelFor(el), value: names });
      }
    },
    true,
  );

  document.addEventListener(
    "keydown",
    (event) => {
      const el = event.target;
      if (event.key !== "Enter" || !el || !isTextField(el) || el instanceof HTMLTextAreaElement) return;
      flushText(el);
      send({ kind: "press", selector: selectorFor(el), label: labelFor(el), value: "Enter" });
    },
    true,
  );
})();
