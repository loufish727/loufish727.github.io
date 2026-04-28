const STORAGE_KEY = "simplecart.items.v2";
const LEGACY_STORAGE_KEY = "simplecart.items.v1";
const SETTINGS_KEY = "simplecart.settings.v2";
const LEGACY_SETTINGS_KEY = "simplecart.settings.v1";
const DEFAULT_STORE_ID = "default-store";
const DEFAULT_STORE_NAME = "Grocery List";
const CATEGORIES = ["Produce", "Meat", "Dairy", "Frozen", "Pantry", "Drinks", "Household", "Other"];
const CATEGORY_ICONS = {
  Produce: "\u{1F96C}",
  Meat: "\u{1F969}",
  Dairy: "\u{1F95B}",
  Frozen: "\u2744\uFE0F",
  Pantry: "\u{1F96B}",
  Drinks: "\u{1F964}",
  Household: "\u{1F9FC}",
  Other: "\u{1F6D2}",
};
const DEFAULT_SAVED_FOODS = [
  { name: "Milk", quantity: "", category: "Dairy" },
  { name: "Eggs", quantity: "", category: "Dairy" },
  { name: "Bread", quantity: "", category: "Pantry" },
  { name: "Chicken", quantity: "", category: "Meat" },
  { name: "Apples", quantity: "", category: "Produce" },
  { name: "Bananas", quantity: "", category: "Produce" },
  { name: "Rice", quantity: "", category: "Pantry" },
  { name: "Coffee", quantity: "", category: "Drinks" },
];

const state = {
  stores: [{ id: DEFAULT_STORE_ID, name: DEFAULT_STORE_NAME }],
  activeStoreId: DEFAULT_STORE_ID,
  items: [],
  search: "",
  sortByCategory: true,
  uncheckedFirst: true,
  collapsedStores: [],
  savedFoods: [...DEFAULT_SAVED_FOODS],
  editingSavedFoods: false,
  editingStores: false,
};

const els = {
  storeForm: document.querySelector("#store-form"),
  storeName: document.querySelector("#store-name"),
  storeSelect: document.querySelector("#store-select"),
  storeSummary: document.querySelector("#store-summary"),
  editStores: document.querySelector("#edit-stores"),
  storeManager: document.querySelector("#store-manager"),
  form: document.querySelector("#item-form"),
  name: document.querySelector("#item-name"),
  quantity: document.querySelector("#item-quantity"),
  category: document.querySelector("#item-category"),
  quickAdd: document.querySelector("#quick-add"),
  editSavedFoods: document.querySelector("#edit-saved-foods"),
  search: document.querySelector("#search-input"),
  list: document.querySelector("#item-list"),
  empty: document.querySelector("#empty-state"),
  count: document.querySelector("#item-count"),
  copyList: document.querySelector("#copy-list"),
  copySheet: document.querySelector("#copy-sheet"),
  copyOutput: document.querySelector("#copy-output"),
  copyOutputButton: document.querySelector("#copy-output-button"),
  closeCopySheet: document.querySelector("#close-copy-sheet"),
  resetChecks: document.querySelector("#reset-checks"),
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

function uniqueStores(stores) {
  const seen = new Set();
  return stores.filter((store) => {
    let name = normalizeText(store.name || "");
    if (!store.id || !name || seen.has(store.id)) {
      return false;
    }
    if (store.id === DEFAULT_STORE_ID && name.toLowerCase() === "my store") {
      name = DEFAULT_STORE_NAME;
    }
    seen.add(store.id);
    store.name = name;
    return true;
  });
}

function normalizeSavedFood(food) {
  const name = normalizeText(food.name || "");
  const quantity = normalizeText(food.quantity || "");
  const category = CATEGORIES.includes(food.category) ? food.category : "Other";
  if (!name) {
    return null;
  }
  return { name, quantity, category };
}

function mergeSavedFoods(foods) {
  const merged = new Map();
  [...DEFAULT_SAVED_FOODS, ...foods].forEach((food) => {
    const clean = normalizeSavedFood(food);
    if (!clean) {
      return;
    }
    merged.set(clean.name.toLowerCase(), clean);
  });
  return [...merged.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function loadItems() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY) || "[]";
    const parsed = JSON.parse(saved);
    state.items = Array.isArray(parsed)
      ? parsed.map((item) => ({ ...item, storeId: item.storeId || DEFAULT_STORE_ID, lastBoughtAt: item.lastBoughtAt || null }))
      : [];
  } catch {
    state.items = [];
  }
}

function loadSettings() {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY) || localStorage.getItem(LEGACY_SETTINGS_KEY) || "{}";
    const parsed = JSON.parse(saved);
    const savedStores = uniqueStores(parsed.stores || []);
    state.stores = savedStores.length > 0 ? savedStores : [{ id: DEFAULT_STORE_ID, name: DEFAULT_STORE_NAME }];
    state.activeStoreId = state.stores.some((store) => store.id === parsed.activeStoreId)
      ? parsed.activeStoreId
      : state.stores[0].id;
    state.sortByCategory = parsed.sortByCategory !== false;
    state.uncheckedFirst = parsed.uncheckedFirst !== false;
    state.collapsedStores = Array.isArray(parsed.collapsedStores) ? parsed.collapsedStores : [];
    state.savedFoods = mergeSavedFoods(parsed.savedFoods || []);
  } catch {
    state.stores = [{ id: DEFAULT_STORE_ID, name: DEFAULT_STORE_NAME }];
    state.activeStoreId = DEFAULT_STORE_ID;
    state.sortByCategory = true;
    state.uncheckedFirst = true;
    state.collapsedStores = [];
    state.savedFoods = mergeSavedFoods([]);
  }
}

function saveItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({
    stores: state.stores,
    activeStoreId: state.activeStoreId,
    sortByCategory: state.sortByCategory,
    uncheckedFirst: state.uncheckedFirst,
    collapsedStores: state.collapsedStores,
    savedFoods: state.savedFoods,
  }));
}

function activeStore() {
  return state.stores.find((store) => store.id === state.activeStoreId) || state.stores[0];
}

function customStores() {
  return state.stores.filter((store) => store.id !== DEFAULT_STORE_ID);
}

function visibleStores() {
  const custom = customStores();
  return custom.length > 0 ? custom : state.stores;
}

function storeItems() {
  return state.items.filter((item) => item.storeId === state.activeStoreId);
}

function populateCategories() {
  els.category.innerHTML = CATEGORIES.map((category) => `<option value="${category}">${category}</option>`).join("");
}

function populateStores() {
  const stores = visibleStores();
  if (!stores.some((store) => store.id === state.activeStoreId)) {
    state.activeStoreId = stores[0]?.id || DEFAULT_STORE_ID;
  }
  els.storeSelect.innerHTML = stores
    .map((store) => `<option value="${store.id}">${store.name}</option>`)
    .join("");
  els.storeSelect.value = state.activeStoreId;
}

function renderStoreManager() {
  els.editStores.classList.toggle("active", state.editingStores);
  els.editStores.setAttribute("aria-pressed", String(state.editingStores));
  els.editStores.textContent = state.editingStores ? "Done" : "Edit stores";
  els.storeManager.hidden = !state.editingStores;
  els.storeManager.innerHTML = "";

  if (!state.editingStores) {
    return;
  }

  visibleStores().forEach((store) => {
    const row = document.createElement("div");
    row.className = "store-manager-row";

    const name = document.createElement("strong");
    const itemCount = state.items.filter((item) => item.storeId === store.id).length;
    name.textContent = `${store.name} (${itemCount})`;

    const actions = document.createElement("div");
    actions.className = "store-manager-actions";

    const rename = document.createElement("button");
    rename.type = "button";
    rename.className = "toggle-button";
    rename.textContent = "Rename";
    rename.addEventListener("click", () => renameStore(store.id));

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "toggle-button danger-button";
    remove.textContent = "Delete";
    remove.addEventListener("click", () => deleteStore(store.id));

    actions.append(rename, remove);
    row.append(name, actions);
    els.storeManager.append(row);
  });
}

function renderQuickAdd() {
  els.quickAdd.innerHTML = "";
  els.quickAdd.classList.toggle("editing", state.editingSavedFoods);
  els.editSavedFoods.classList.toggle("active", state.editingSavedFoods);
  els.editSavedFoods.setAttribute("aria-pressed", String(state.editingSavedFoods));
  els.editSavedFoods.textContent = state.editingSavedFoods ? "Done" : "Edit foods";
  state.savedFoods.forEach((food) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.quick = food.name;
    button.dataset.quantity = food.quantity;
    button.dataset.category = food.category;
    button.textContent = state.editingSavedFoods ? `Remove ${food.name}` : food.name;
    els.quickAdd.append(button);
  });
}

function removeSavedFood(name) {
  const key = normalizeText(name).toLowerCase();
  state.savedFoods = state.savedFoods.filter((food) => food.name.toLowerCase() !== key);
  saveSettings();
  renderQuickAdd();
}

function rememberSavedFood(name, quantity = "", category = "Other") {
  const clean = normalizeSavedFood({ name, quantity, category });
  if (!clean) {
    return;
  }
  const existingIndex = state.savedFoods.findIndex((food) => food.name.toLowerCase() === clean.name.toLowerCase());
  if (existingIndex >= 0) {
    state.savedFoods[existingIndex] = {
      ...state.savedFoods[existingIndex],
      quantity: clean.quantity || state.savedFoods[existingIndex].quantity,
      category: clean.category,
    };
  } else {
    state.savedFoods.push(clean);
  }
  state.savedFoods = mergeSavedFoods(state.savedFoods);
  saveSettings();
  renderQuickAdd();
}

function updateSavedFood(oldName, name, quantity = "", category = "Other") {
  const clean = normalizeSavedFood({ name, quantity, category });
  if (!clean) {
    return;
  }

  const oldKey = normalizeText(oldName).toLowerCase();
  const existingIndex = state.savedFoods.findIndex((food) => food.name.toLowerCase() === oldKey);
  if (existingIndex >= 0) {
    state.savedFoods[existingIndex] = {
      ...clean,
      quantity: clean.quantity || state.savedFoods[existingIndex].quantity,
    };
  } else {
    state.savedFoods.push(clean);
  }
  state.savedFoods = mergeSavedFoods(state.savedFoods);
  saveSettings();
  renderQuickAdd();
}

function findOrCreateStoreByName(name) {
  const cleanName = normalizeText(name);
  if (!cleanName) {
    return activeStore();
  }

  const existing = state.stores.find((store) => store.name.toLowerCase() === cleanName.toLowerCase());
  if (existing) {
    return existing;
  }

  const store = { id: createId(), name: cleanName };
  state.stores.push(store);
  saveSettings();
  return store;
}

function renameStore(storeId) {
  const store = state.stores.find((candidate) => candidate.id === storeId);
  if (!store) {
    return;
  }

  const name = normalizeText(window.prompt("Store name", store.name) || "");
  if (!name) {
    return;
  }

  const duplicate = state.stores.find((candidate) => (
    candidate.id !== storeId && candidate.name.toLowerCase() === name.toLowerCase()
  ));
  if (duplicate) {
    window.alert("That store name already exists.");
    return;
  }

  store.name = name;
  saveSettings();
  render();
}

function deleteStore(storeId) {
  const store = state.stores.find((candidate) => candidate.id === storeId);
  if (!store) {
    return;
  }

  const itemCount = state.items.filter((item) => item.storeId === storeId).length;
  const message = itemCount > 0
    ? `Delete ${store.name} and its ${itemCount} saved ${itemCount === 1 ? "item" : "items"}?`
    : `Delete ${store.name}?`;
  if (!window.confirm(message)) {
    return;
  }

  state.items = state.items.filter((item) => item.storeId !== storeId);
  state.stores = state.stores.filter((candidate) => candidate.id !== storeId);
  state.collapsedStores = state.collapsedStores.filter((id) => id !== storeId);

  if (state.stores.length === 0) {
    state.stores = [{ id: DEFAULT_STORE_ID, name: DEFAULT_STORE_NAME }];
  }
  if (!state.stores.some((candidate) => candidate.id === state.activeStoreId)) {
    state.activeStoreId = visibleStores()[0]?.id || state.stores[0].id;
  }

  saveItems();
  saveSettings();
  render();
}

function addStore(name) {
  const cleanName = normalizeText(name);
  if (!cleanName) {
    return;
  }

  const existing = state.stores.find((store) => store.name.toLowerCase() === cleanName.toLowerCase());
  if (existing) {
    state.activeStoreId = existing.id;
  } else {
    const store = { id: createId(), name: cleanName };
    const isFirstCustomStore = customStores().length === 0;
    state.stores.push(store);
    state.activeStoreId = store.id;
    if (isFirstCustomStore) {
      state.items = state.items.map((item) => (
        item.storeId === DEFAULT_STORE_ID ? { ...item, storeId: store.id } : item
      ));
      state.stores = state.stores.filter((candidate) => candidate.id !== DEFAULT_STORE_ID);
      saveItems();
    }
  }

  els.storeName.value = "";
  saveSettings();
  render();
}

function removeDefaultStoreWhenPossible() {
  const custom = customStores();
  if (custom.length === 0) {
    return;
  }

  const targetStoreId = state.activeStoreId !== DEFAULT_STORE_ID
    ? state.activeStoreId
    : custom[0].id;
  state.items = state.items.map((item) => (
    item.storeId === DEFAULT_STORE_ID ? { ...item, storeId: targetStoreId } : item
  ));
  state.stores = state.stores.filter((store) => store.id !== DEFAULT_STORE_ID);
  if (!state.stores.some((store) => store.id === state.activeStoreId)) {
    state.activeStoreId = targetStoreId;
  }
}

function addItem(name, quantity = "", category = "Other") {
  const itemName = normalizeText(name);
  const itemQuantity = normalizeText(quantity);
  const itemCategory = CATEGORIES.includes(category) ? category : "Other";

  if (!itemName) {
    return;
  }

  rememberSavedFood(itemName, itemQuantity, itemCategory);

  const existing = state.items.find((item) => (
    item.storeId === state.activeStoreId &&
    item.name.toLowerCase() === itemName.toLowerCase()
  ));

  if (existing) {
    existing.name = itemName;
    existing.quantity = itemQuantity || existing.quantity;
    existing.category = itemCategory;
    existing.completed = false;
    existing.createdAt = Date.now();
  } else {
    state.items.unshift({
      id: createId(),
      storeId: state.activeStoreId,
      name: itemName,
      quantity: itemQuantity,
      category: itemCategory,
      completed: false,
      lastBoughtAt: null,
      createdAt: Date.now(),
    });
  }

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
  const currentStore = state.stores.find((store) => store.id === item.storeId) || activeStore();

  const name = normalizeText(window.prompt("Item name", item.name) || "");
  if (!name) {
    return;
  }

  const quantity = normalizeText(window.prompt("Quantity", item.quantity) || "");
  const categoryInput = normalizeText(window.prompt(`Category (${CATEGORIES.join(", ")})`, item.category) || item.category);
  const category = CATEGORIES.find((candidate) => candidate.toLowerCase() === categoryInput.toLowerCase()) || "Other";
  const storeInput = normalizeText(window.prompt(`Store (${visibleStores().map((store) => store.name).join(", ")})`, currentStore.name) || currentStore.name);
  const store = findOrCreateStoreByName(storeInput);
  updateSavedFood(item.name, name, quantity, category);
  updateItem(id, { name, quantity, category, storeId: store.id });
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

function itemMatchesSearch(item) {
  const search = state.search.toLowerCase();
  if (!search) {
    return true;
  }
  return [item.name, item.quantity, item.category].some((value) => value.toLowerCase().includes(search));
}

function filteredItems() {
  return sortItems(state.items.filter(itemMatchesSearch));
}

function groupedItems(items) {
  if (!state.sortByCategory) {
    return [["All items", items]];
  }

  return CATEGORIES
    .map((category) => [category, items.filter((item) => item.category === category)])
    .filter(([, groupItems]) => groupItems.length > 0);
}

function formatBoughtDate(timestamp) {
  if (!timestamp) {
    return "";
  }
  const boughtDate = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (boughtDate.toDateString() === today.toDateString()) {
    return "Bought today";
  }
  if (boughtDate.toDateString() === yesterday.toDateString()) {
    return "Bought yesterday";
  }
  return `Bought ${boughtDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

function renderItem(item) {
  const node = els.itemTemplate.content.firstElementChild.cloneNode(true);
  node.dataset.id = item.id;
  node.classList.toggle("completed", item.completed);
  node.querySelector(".item-check").checked = item.completed;
  node.querySelector(".item-name").textContent = item.name;
  node.querySelector(".item-quantity").textContent = item.quantity || item.category;
  node.querySelector(".item-quantity").hidden = !item.quantity && !item.category;
  node.querySelector(".item-meta").textContent = item.completed ? formatBoughtDate(item.lastBoughtAt) : "";
  node.querySelector(".item-meta").hidden = !item.completed || !item.lastBoughtAt;
  node.querySelector(".item-check").addEventListener("change", (event) => {
    updateItem(item.id, {
      completed: event.target.checked,
      lastBoughtAt: event.target.checked ? Date.now() : item.lastBoughtAt,
    });
  });
  node.querySelector(".edit-button").addEventListener("click", () => editItem(item.id));
  node.querySelector(".delete-button").addEventListener("click", () => removeItem(item.id));
  return node;
}

function toggleStoreCollapse(storeId) {
  if (state.collapsedStores.includes(storeId)) {
    state.collapsedStores = state.collapsedStores.filter((id) => id !== storeId);
  } else {
    state.collapsedStores.push(storeId);
  }
  saveSettings();
  render();
}

function renderStoreGroup(store, items) {
  const storeSection = document.createElement("section");
  const collapsed = state.collapsedStores.includes(store.id);
  storeSection.className = "store-list-group";
  storeSection.classList.toggle("active-store", store.id === state.activeStoreId);
  storeSection.classList.toggle("collapsed", collapsed);

  const remaining = items.filter((item) => !item.completed).length;
  const heading = document.createElement("button");
  heading.className = "store-list-heading";
  heading.type = "button";
  heading.setAttribute("aria-expanded", String(!collapsed));
  heading.addEventListener("click", () => toggleStoreCollapse(store.id));

  const title = document.createElement("h2");
  title.textContent = store.name;

  const meta = document.createElement("span");
  meta.textContent = `${collapsed ? "\u25B8" : "\u25BE"} ${remaining} of ${items.length} left`;

  heading.append(title, meta);
  storeSection.append(heading);

  if (!collapsed) {
    groupedItems(items).forEach(([category, groupItems]) => {
      const group = els.categoryTemplate.content.firstElementChild.cloneNode(true);
      group.querySelector("h2").textContent = `${CATEGORY_ICONS[category]} ${category}`;
      const container = group.querySelector(".category-items");
      groupItems.forEach((item) => container.append(renderItem(item)));
      storeSection.append(group);
    });
  }

  return storeSection;
}

function formatListForText() {
  const lines = ["SimpleCart"];

  visibleStores().forEach((store) => {
    const items = sortItems(state.items.filter((item) => item.storeId === store.id));
    if (items.length === 0) {
      return;
    }

    lines.push("", store.name);
    groupedItems(items).forEach(([, groupItems]) => {
      groupItems.forEach((item) => {
        const icon = CATEGORY_ICONS[item.category] || CATEGORY_ICONS.Other;
        const quantity = item.quantity ? ` - ${item.quantity}` : "";
        const itemText = `${item.name}${quantity}`;
        lines.push(`${icon} ${item.completed ? formatCompletedText(itemText) : itemText}`);
      });
    });
  });

  return lines.join("\n");
}

function formatCompletedText(text) {
  return `━━━━ ${text} ━━━━`;
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
  els.copyOutput.value = text;
  els.copySheet.hidden = false;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      fallbackCopyText(text);
    }
    showCopyStatus("Copied");
  } catch {
    showCopyStatus("Select text");
  }
}

async function copyOutputText() {
  const text = els.copyOutput.value;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      fallbackCopyText(text);
    }
    showCopyStatus("Copied");
  } catch {
    els.copyOutput.focus();
    els.copyOutput.select();
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

function resetCurrentStoreChecks() {
  state.items = state.items.map((item) => (
    item.storeId === state.activeStoreId ? { ...item, completed: false } : item
  ));
  saveItems();
  render();
}

function render() {
  populateStores();
  renderStoreManager();
  renderQuickAdd();
  const items = filteredItems();
  const currentStoreItems = storeItems();
  els.list.innerHTML = "";

  visibleStores().forEach((store) => {
    const storeMatches = sortItems(state.items.filter((item) => (
      item.storeId === store.id && itemMatchesSearch(item)
    )));
    if (storeMatches.length > 0) {
      els.list.append(renderStoreGroup(store, storeMatches));
    }
  });

  const currentCompleted = currentStoreItems.filter((item) => item.completed).length;
  const total = state.items.length;
  const remaining = state.items.filter((item) => !item.completed).length;
  const storeName = activeStore().name;
  els.storeSummary.textContent = `Adding to ${storeName}`;
  els.empty.textContent = total === 0
    ? "Your cart is empty. Add your first item."
    : "No matching items.";
  els.empty.hidden = items.length > 0;
  els.count.textContent = `${remaining} of ${total} left`;
  els.copyList.disabled = state.items.length === 0;
  els.resetChecks.disabled = currentCompleted === 0;
  els.resetChecks.textContent = currentCompleted > 0 ? `Uncheck ${storeName} (${currentCompleted})` : "Uncheck all";
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

els.storeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addStore(els.storeName.value);
});

els.storeSelect.addEventListener("change", (event) => {
  state.activeStoreId = event.target.value;
  saveSettings();
  render();
});

els.editStores.addEventListener("click", () => {
  state.editingStores = !state.editingStores;
  renderStoreManager();
});

els.form.addEventListener("submit", (event) => {
  event.preventDefault();
  addItem(els.name.value, els.quantity.value, els.category.value);
  els.form.reset();
  els.category.value = "Other";
  els.name.focus();
});

els.quickAdd.addEventListener("click", (event) => {
  const button = event.target.closest("[data-quick]");
  if (!button) {
    return;
  }
  if (state.editingSavedFoods) {
    removeSavedFood(button.dataset.quick);
    return;
  }
  addItem(button.dataset.quick, button.dataset.quantity || "", button.dataset.category);
});

els.editSavedFoods.addEventListener("click", () => {
  state.editingSavedFoods = !state.editingSavedFoods;
  renderQuickAdd();
});

els.search.addEventListener("input", (event) => {
  state.search = event.target.value;
  render();
});

els.resetChecks.addEventListener("click", resetCurrentStoreChecks);
els.copyList.addEventListener("click", copyListToClipboard);
els.copyOutputButton.addEventListener("click", copyOutputText);
els.closeCopySheet.addEventListener("click", () => {
  els.copySheet.hidden = true;
});
els.copySheet.addEventListener("click", (event) => {
  if (event.target === els.copySheet) {
    els.copySheet.hidden = true;
  }
});

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
removeDefaultStoreWhenPossible();
state.savedFoods = mergeSavedFoods([
  ...state.savedFoods,
  ...state.items.map((item) => ({ name: item.name, quantity: item.quantity, category: item.category })),
]);
saveItems();
saveSettings();
render();
registerServiceWorker();
