const STORAGE_KEY = "simplecart.items.v1";
const SETTINGS_KEY = "simplecart.settings.v1";
const CATEGORIES = ["Produce", "Meat", "Dairy", "Frozen", "Pantry", "Drinks", "Household", "Other"];

const state = {
  items: [],
  search: "",
  sortByCategory: true,
  uncheckedFirst: true,
};

const els = {
  form: document.querySelector("#item-form"),
  name: document.querySelector("#item-name"),
  quantity: document.querySelector("#item-quantity"),
  category: document.querySelector("#item-category"),
  search: document.querySelector("#search-input"),
  list: document.querySelector("#item-list"),
  empty: document.querySelector("#empty-state"),
  count: document.querySelector("#item-count"),
  copyList: document.querySelector("#copy-list"),
  clearCompleted: document.querySelector("#clear-completed"),
  sortCategory: document.querySelector("#sort-category"),
  sortUnchecked: document.querySelector("#sort-unchecked"),
  itemTemplate: document.querySelector("#item-template"),
  categoryTemplate: document.querySelector("#category-template"),
};

function createId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeText(value) {
  return value.trim().replace(/\s+/g, " ");
}

function loadItems() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    state.items = Array.isArray(parsed) ? parsed : [];
  } catch {
    state.items = [];
  }
}

function loadSettings() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    state.sortByCategory = parsed.sortByCategory !== false;
    state.uncheckedFirst = parsed.uncheckedFirst !== false;
  } catch {
    state.sortByCategory = true;
    state.uncheckedFirst = true;
  }
}

function saveItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({
    sortByCategory: state.sortByCategory,
    uncheckedFirst: state.uncheckedFirst,
  }));
}

function populateCategories() {
  els.category.innerHTML = CATEGORIES.map((category) => `<option value="${category}">${category}</option>`).join("");
}

function addItem(name, quantity = "", category = "Other") {
  const item = {
    id: createId(),
    name: normalizeText(name),
    quantity: normalizeText(quantity),
    category: CATEGORIES.includes(category) ? category : "Other",
    completed: false,
    createdAt: Date.now(),
  };

  if (!item.name) {
    return;
  }

  state.items.unshift(item);
  saveItems();
  render();
}

function updateItem(id, updates) {
  state.items = state.items.map((item) => (item.id === id ? { ...item, ...updates } : item));
  saveItems();
  render();
}

function removeItem(id) {
  const row = document.querySelector(`[data-id="${CSS.escape(id)}"]`);
  if (!row) {
    state.items = state.items.filter((item) => item.id !== id);
    saveItems();
    render();
    return;
  }

  row.classList.add("is-removing");
  window.setTimeout(() => {
    state.items = state.items.filter((item) => item.id !== id);
    saveItems();
    render();
  }, 170);
}

function editItem(id) {
  const item = state.items.find((candidate) => candidate.id === id);
  if (!item) {
    return;
  }

  const name = normalizeText(window.prompt("Item name", item.name) || "");
  if (!name) {
    return;
  }

  const quantity = normalizeText(window.prompt("Quantity", item.quantity) || "");
  const categoryInput = normalizeText(window.prompt(`Category (${CATEGORIES.join(", ")})`, item.category) || item.category);
  const category = CATEGORIES.find((candidate) => candidate.toLowerCase() === categoryInput.toLowerCase()) || "Other";
  updateItem(id, { name, quantity, category });
}

function sortItems(items) {
  return [...items].sort((a, b) => {
    if (state.uncheckedFirst && a.completed !== b.completed) {
      return Number(a.completed) - Number(b.completed);
    }
    if (state.sortByCategory && a.category !== b.category) {
      return CATEGORIES.indexOf(a.category) - CATEGORIES.indexOf(b.category);
    }
    return b.createdAt - a.createdAt;
  });
}

function filteredItems() {
  const search = state.search.toLowerCase();
  const matches = state.items
    .filter((item) => {
      if (!search) {
        return true;
      }
      return [item.name, item.quantity, item.category].some((value) => value.toLowerCase().includes(search));
    });
  return sortItems(matches);
}

function groupedItems(items) {
  if (!state.sortByCategory) {
    return [["All items", items]];
  }

  return CATEGORIES
    .map((category) => [category, items.filter((item) => item.category === category)])
    .filter(([, groupItems]) => groupItems.length > 0);
}

function renderItem(item) {
  const node = els.itemTemplate.content.firstElementChild.cloneNode(true);
  node.dataset.id = item.id;
  node.classList.toggle("completed", item.completed);
  node.querySelector(".item-check").checked = item.completed;
  node.querySelector(".item-name").textContent = item.name;
  node.querySelector(".item-quantity").textContent = item.quantity || item.category;
  node.querySelector(".item-quantity").hidden = !item.quantity && !item.category;
  node.querySelector(".item-check").addEventListener("change", (event) => {
    updateItem(item.id, { completed: event.target.checked });
  });
  node.querySelector(".edit-button").addEventListener("click", () => editItem(item.id));
  node.querySelector(".delete-button").addEventListener("click", () => removeItem(item.id));
  return node;
}

function formatListForText() {
  const groups = groupedItems(sortItems(state.items));
  const lines = ["SimpleCart", "Change \u2610 to \u2611 as you shop."];

  groups.forEach(([category, groupItems]) => {
    lines.push("", category);
    groupItems.forEach((item) => {
      const check = item.completed ? "\u2611" : "\u2610";
      const quantity = item.quantity ? ` - ${item.quantity}` : "";
      lines.push(`${check} ${item.name}${quantity}`);
    });
  });

  return lines.join("\n");
}

function fallbackCopyText(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-999px";
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) {
    throw new Error("Copy command was not available.");
  }
}

async function copyListToClipboard() {
  if (state.items.length === 0) {
    return;
  }

  const text = formatListForText();
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      fallbackCopyText(text);
    }
    showCopyStatus("Copied");
  } catch {
    window.prompt("Copy your grocery list", text);
    showCopyStatus("Select text");
  }
}

function showCopyStatus(label) {
  els.copyList.textContent = label;
  els.copyList.classList.add("copied");
  window.setTimeout(() => {
    els.copyList.textContent = "Copy list";
    els.copyList.classList.remove("copied");
  }, 1800);
}

function render() {
  const items = filteredItems();
  els.list.innerHTML = "";

  groupedItems(items).forEach(([category, groupItems]) => {
    const group = els.categoryTemplate.content.firstElementChild.cloneNode(true);
    group.querySelector("h2").textContent = category;
    const container = group.querySelector(".category-items");
    groupItems.forEach((item) => container.append(renderItem(item)));
    els.list.append(group);
  });

  const total = state.items.length;
  const remaining = state.items.filter((item) => !item.completed).length;
  const completed = total - remaining;
  els.empty.textContent = total === 0 ? "Your cart is empty. Add your first item." : "No matching items.";
  els.empty.hidden = items.length > 0;
  els.count.textContent = `${remaining} ${remaining === 1 ? "item" : "items"} left`;
  els.copyList.disabled = total === 0;
  els.clearCompleted.disabled = completed === 0;
  els.clearCompleted.textContent = completed > 0 ? `Clear completed (${completed})` : "Clear completed";
  els.sortCategory.classList.toggle("active", state.sortByCategory);
  els.sortCategory.setAttribute("aria-pressed", String(state.sortByCategory));
  els.sortUnchecked.classList.toggle("active", state.uncheckedFirst);
  els.sortUnchecked.setAttribute("aria-pressed", String(state.uncheckedFirst));
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js").catch(() => {
      // The app still works without offline caching.
    });
  }
}

els.form.addEventListener("submit", (event) => {
  event.preventDefault();
  addItem(els.name.value, els.quantity.value, els.category.value);
  els.form.reset();
  els.category.value = "Other";
  els.name.focus();
});

document.querySelectorAll("[data-quick]").forEach((button) => {
  button.addEventListener("click", () => {
    addItem(button.dataset.quick, "", button.dataset.category);
  });
});

els.search.addEventListener("input", (event) => {
  state.search = event.target.value;
  render();
});

els.clearCompleted.addEventListener("click", () => {
  state.items = state.items.filter((item) => !item.completed);
  saveItems();
  render();
});

els.copyList.addEventListener("click", copyListToClipboard);

els.sortCategory.addEventListener("click", () => {
  state.sortByCategory = !state.sortByCategory;
  saveSettings();
  render();
});

els.sortUnchecked.addEventListener("click", () => {
  state.uncheckedFirst = !state.uncheckedFirst;
  saveSettings();
  render();
});

populateCategories();
els.category.value = "Other";
loadItems();
loadSettings();
render();
registerServiceWorker();
