import { searchLocations, getCountryName, getRegionName } from "./data.js";
import { t, getLang } from "./i18n.js";

export function createSearch({ onPick, placeholder }) {
  let root;

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = placeholder || t("searchPlaceholder");
  input.autocomplete = "off";
  input.spellcheck = false;
  input.className = "search-input";

  const field = document.createElement("div");
  field.className = "search-field";
  field.innerHTML = SEARCH_ICON;
  field.appendChild(input);

  const clear = document.createElement("button");
  clear.type = "button";
  clear.className = "search-clear";
  clear.title = t("clear");
  clear.innerHTML = X_ICON;
  clear.hidden = true;
  field.appendChild(clear);

  const results = document.createElement("div");
  results.className = "search-results";

  root = document.createElement("div");
  root.className = "search";
  root.append(field, results);

  let items = [];

  function renderResults() {
    const q = input.value.trim();
    items = searchLocations(q);
    results.textContent = "";
    clear.hidden = q.length === 0;
    if (items.length === 0) {
      const empty = document.createElement("div");
      empty.className = "search-empty";
      empty.textContent = t("noResults");
      results.appendChild(empty);
      return;
    }
    const lang = getLang();
    items.forEach((item, index) => {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "search-result";
      row.style.setProperty("--i", index);
      row.dataset.timezone = item.timezone;

      const main = document.createElement("div");
      main.className = "search-result-main";
      main.innerHTML = `<span class="search-result-city"></span><span class="search-result-sub"></span>`;
      main.querySelector(".search-result-city").textContent = item.city;
      main.querySelector(".search-result-sub").textContent =
        getCountryName(item.country, lang) || getRegionName(item.region, lang);

      const tz = document.createElement("code");
      tz.className = "search-result-tz";
      tz.textContent = item.timezone;

      row.append(main, tz);
      row.addEventListener("click", () => {
        onPick(item);
        input.value = "";
        renderResults();
      });
      results.appendChild(row);
    });
  }

  input.addEventListener("input", renderResults);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && items.length > 0) {
      e.preventDefault();
      onPick(items[0]);
      input.value = "";
      renderResults();
    }
    if (e.key === "Escape") {
      input.value = "";
      renderResults();
      input.blur();
    }
  });
  clear.addEventListener("click", () => {
    input.value = "";
    renderResults();
    input.focus();
  });

  return {
    mount(el) {
      el.appendChild(root);
    },
    focus() {
      input.focus();
      if (input.value.trim() === "") renderResults();
    },
    clear() {
      input.value = "";
      renderResults();
    },
  };
}

const SEARCH_ICON = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/></svg>`;

const X_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>`;