// =========================
// SUPABASE CONFIG
// =========================
const SUPABASE_URL = "https://senudcheywqbzbstvpux.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlbnVkY2hleXdxYnpic3R2cHV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2MDA1NzIsImV4cCI6MjA5NjE3NjU3Mn0.dc5G_-tHhq-tjgC27oWkZTPb4WdlBgSYQ0PoG-KXsmg";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =========================
// CATEGORIES VALIDES
// =========================
const CATS_VALIDES = ["Pédagogie", "Événement", "Vie de campus", "Amélioration technique"];

// =========================
// DOM
// =========================
const $ = (id) => document.getElementById(id);

const modal        = $("modal");
const form         = $("formeIdee");
const liste        = $("listeIdees");
const vide         = $("etatVide");
const compteur     = $("compteurIdees");

const ouvrirModal  = $("ouvrirModal");
const btnPartager  = $("btnPartager");
const btnVide      = $("btnVide");
const fermerModal  = $("fermerModal");
const annulerModal = $("annulerModal");

const titre        = $("titre");
const categorie    = $("categorie");
const description  = $("description");
const filtre       = $("filtreCategorie");
const search       = $("recherche");

// =========================
// STATE
// =========================
let editId = null;
let cache  = [];
let page   = 1;

const PAGE_SIZE_DESKTOP = 8;
const PAGE_SIZE_MOBILE  = 4;

function getPageSize() {
  return window.matchMedia("(max-width: 768px)").matches
    ? PAGE_SIZE_MOBILE
    : PAGE_SIZE_DESKTOP;
}

// =========================
// CATEGORIES COULEURS / ICONES
// =========================
const CATEGORIES = {
  "Pédagogie":     { couleur: "#FF6B6B", icone: "fa-book" },
  "Événement":     { couleur: "#FFA94D", icone: "fa-calendar" },
  "Vie de campus": { couleur: "#51CF66", icone: "fa-building" },
  "Amélioration technique": { couleur: "#4C9AFF", icone: "fa-code" },
  "autres":        { couleur: "#888888", icone: "fa-lightbulb" }
};

// =========================
// UTILS
// =========================
const sanitize = (str) => {
  const temp = document.createElement('div');
  temp.textContent = str;
  return temp.innerHTML;
};

// =========================
// CONFIRMATION SUPPRESSION
// =========================
function confirmerSuppression() {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position:fixed; inset:0; background:rgba(0,0,0,0.5);
      display:flex; align-items:center; justify-content:center;
      z-index:9999;
    `;

    const box = document.createElement("div");
    box.style.cssText = `
      background:#fff; border-radius:16px; padding:32px 28px;
      max-width:360px; width:90%; text-align:center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.2);
    `;

    box.innerHTML = `
      <div style="font-size:2.5rem; margin-bottom:12px;"></div>
      <h3 style="margin:0 0 8px; font-size:1.2rem; color:#1e293b;">Supprimer cette idée ?</h3>
      <p style="color:#64748b; font-size:0.9rem; margin:0 0 24px;">Cette action est irréversible.</p>
      <div style="display:flex; gap:12px; justify-content:center;">
        <button id="confirmNon" style="padding:10px 24px; border-radius:8px; border:2px solid #e2e8f0; background:#fff; color:#475569; font-size:0.95rem; cursor:pointer; font-weight:600;">Annuler</button>
        <button id="confirmOui" style="padding:10px 24px; border-radius:8px; border:none; background:#ef4444; color:#fff; font-size:0.95rem; cursor:pointer; font-weight:600;">Supprimer</button>
      </div>
    `;

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    const close = (result) => { overlay.remove(); resolve(result); };
    box.querySelector("#confirmOui").onclick = () => close(true);
    box.querySelector("#confirmNon").onclick = () => close(false);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(false); });
  });
}

// =========================
// IA — catégorie auto
// =========================
async function devinerCategorieIA(titreVal, descVal) {
  try {
    const res = await fetch("/api/categorize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titre: titreVal, description: descVal, categories: CATS_VALIDES })
    });
    if (!res.ok) throw new Error("API classify error");
    const data = await res.json();
    const cat = data?.categorie;
    if (!cat) return "Amélioration technique";
    return CATS_VALIDES.includes(cat) ? cat : "Amélioration technique";
  } catch (err) {
    console.warn("IA indisponible :", err);
    return "Amélioration technique";
  }
}

// =========================
// MODAL
// =========================
function openModal(idee = null) {
  editId = idee?.id || null;

  // Réinitialise les états de validation
  resetValidation();

  if (idee) {
    titre.value       = idee.titre       || "";
    description.value = idee.description || "";
    categorie.value   = idee.categorie   || "";
  } else {
    form.reset();
  }

  updateCounters();
  modal.classList.add("modal--active");
}

function closeModal() {
  modal.classList.remove("modal--active");
  form.reset();
  resetValidation();
  editId = null;
}

[ouvrirModal, btnPartager, btnVide].forEach(btn => {
  btn?.addEventListener("click", () => openModal());
});
fermerModal?.addEventListener("click", closeModal);
annulerModal?.addEventListener("click", closeModal);
modal?.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

// =========================
// TOAST
// =========================
function toast(msg, type = "success") {
  let c = document.querySelector(".toast-container");
  if (!c) {
    c = document.createElement("div");
    c.className = "toast-container";
    document.body.appendChild(c);
  }
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// =========================
// CHARGEMENT DONNÉES
// =========================
async function loadIdees() {
  const { data, error } = await db
    .from("idees")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) { console.error(error); return []; }

  return data.map(i => ({
    ...i,
    date: new Date(i.created_at).toLocaleDateString("fr-FR")
  }));
}

// =========================
// VALIDATION
// =========================

// Remet tous les champs à l'état neutre
function resetValidation() {
  [titre, description].forEach(el => {
    if (!el) return;
    el.classList.remove("field--error", "field--success");
  });
  setMsg("errTitre", "");
  setMsg("errDescription", "");
  updateCounters();
}

// Affiche ou efface un message d'erreur
function setMsg(id, msg) {
  const el = $(id);
  if (el) el.textContent = msg;
}

// Applique l'état visuel sur un champ
function setFieldState(inputEl, errId, msg, ok) {
  if (inputEl) {
    inputEl.classList.toggle("field--error",   !ok);
    inputEl.classList.toggle("field--success",  ok);
  }
  setMsg(errId, ok ? "" : msg);
}

// Validation titre
function validateTitre() {
  const val = titre.value.trim();

  if (!val) {
    setFieldState(titre, "errTitre", "Ce champ est obligatoire.", false);
    return false;
  }
  if (val.length < 5) {
    setFieldState(titre, "errTitre", "Minimum 5 caractères requis.", false);
    return false;
  }
  if (val.length > 20) {
    setFieldState(titre, "errTitre", "Maximum 20 caractères autorisés.", false);
    return false;
  }

  setFieldState(titre, "errTitre", "", true);
  return true;
}

// Validation description
function validateDescription() {
  const val = description.value.trim();

  if (!val) {
    setFieldState(description, "errDescription", "Ce champ est obligatoire.", false);
    return false;
  }
  if (val.length < 30) {
    setFieldState(description, "errDescription", "Minimum 30 caractères requis.", false);
    return false;
  }
  if (val.length > 255) {
    setFieldState(description, "errDescription", "Maximum 255 caractères autorisés.", false);
    return false;
  }

  setFieldState(description, "errDescription", "", true);
  return true;
}

function validateForm() {
  const okT = validateTitre();
  const okD = validateDescription();
  return okT && okD;
}

// =========================
// COMPTEURS DE CARACTÈRES
// =========================
function updateCounters() {
  const cTitre = $("counterTitre");
  const cDesc  = $("counterDescription");

  if (cTitre) {
    const restants = Math.max(0, 20 - titre.value.length);
    cTitre.textContent = `${restants} restant${restants !== 1 ? "s" : ""}`;
    cTitre.style.color = restants <= 3 ? "#ef4444" : "#9ca3af";
  }

  if (cDesc) {
    const restants = Math.max(0, 255 - description.value.length);
    cDesc.textContent = `${restants} restant${restants !== 1 ? "s" : ""}`;
    cDesc.style.color = restants <= 20 ? "#ef4444" : "#9ca3af";
  }
}

// Validation + compteur en temps réel
titre?.addEventListener("input", () => { updateCounters(); validateTitre(); });
titre?.addEventListener("blur",  () => { validateTitre(); });
description?.addEventListener("input", () => { updateCounters(); validateDescription(); });
description?.addEventListener("blur",  () => { validateDescription(); });

// =========================
// LOADER IA (champ catégorie)
// =========================
function showIALoader(visible) {
  const select = $("categorie");
  const wrapper = select?.parentElement;

  let loader = $("ia-loader");

  if (visible) {
    if (loader) return; // déjà présent

    // Grise et cache le select
    if (select) {
      select.style.display = "none";
    }

    // Crée le bloc loader
    loader = document.createElement("div");
    loader.id = "ia-loader";
    loader.innerHTML = `
      <div class="ia-loader__inner">
        <span class="ia-loader__spinner"></span>
        <span class="ia-loader__text">L'IA choisit la catégorie…</span>
      </div>
    `;

    wrapper?.appendChild(loader);
  } else {
    // Retire le loader
    loader?.remove();
    if (select) select.style.display = "";
  }
}

// =========================
// SOUMISSION FORMULAIRE
// =========================
form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!validateForm()) return;

  const titreVal = sanitize(titre.value.trim());
  const descVal  = sanitize(description.value.trim());

  const btnSubmit = form.querySelector("[type=submit]");
  btnSubmit.disabled    = true;
  btnSubmit.textContent = "Validation...";

  try {
    let catVal = categorie.value;

    if (!catVal || !CATS_VALIDES.includes(catVal)) {
      btnSubmit.textContent = "Analyse IA en cours...";
      showIALoader(true);
      catVal = await devinerCategorieIA(titreVal, descVal);
      showIALoader(false);
    }

    btnSubmit.textContent = "Enregistrement...";
    if (editId) {
      const { error } = await db
        .from("idees")
        .update({ titre: titreVal, categorie: catVal, description: descVal })
        .eq("id", editId);
      if (error) throw error;

      const idx = cache.findIndex(i => i.id === editId);
      if (idx !== -1) {
        cache[idx] = { ...cache[idx], titre: titreVal, categorie: catVal, description: descVal };
      }
      toast("Idée modifiée ");

    } else {
      const { data, error } = await db
        .from("idees")
        .insert([{ titre: titreVal, categorie: catVal, description: descVal }])
        .select()
        .single();
      if (error) throw error;

      cache.unshift({
        ...data,
        date: new Date(data.created_at).toLocaleDateString("fr-FR")
      });
      toast(`Ajoutée — ${catVal}`);
    }

    closeModal();
    render();

  } catch (err) {
    console.error(err);
    toast("Erreur : " + err.message, "delete");
  } finally {
    btnSubmit.disabled    = false;
    btnSubmit.textContent = "Soumettre";
  }
});

// =========================
// SUPPRESSION
// =========================
async function remove(id) {
  const ok = await confirmerSuppression();
  if (!ok) return;

  const { error } = await db.from("idees").delete().eq("id", id);
  if (error) { toast("Erreur lors de la suppression", "delete"); return; }

  cache = cache.filter(i => i.id !== id);
  render();
  toast("Idée supprimée ", "delete");
}

// =========================
// CARTE
// =========================
function card(i) {
  const c = CATEGORIES[i?.categorie] || CATEGORIES.autres;

  const div = document.createElement("div");
  div.className = "carte";
  div.style.setProperty("--cat-color", c.couleur);

  div.innerHTML = `
    <div class="carte__entete">
      <div class="carte__categorie">
        <i class="fas ${c.icone}"></i> ${i?.categorie || "Autres"}
      </div>
      <span class="carte__date">${i?.date || ""}</span>
    </div>
    <h3 class="carte__titre">${i?.titre || ""}</h3>
    <p class="carte__description">${i?.description || ""}</p>
    <div class="carte__actions">
      <button class="edit" title="Modifier" type="button"><i class="fas fa-pen"></i></button>
      <button class="del" title="Supprimer" type="button"><i class="fas fa-trash"></i></button>
    </div>
  `;

  const id    = i?.id;
  const idStr = id == null ? null : String(id);

  div.querySelector(".edit")?.addEventListener("click", () => {
    if (!idStr) { toast("Erreur : id manquant", "delete"); return; }
    const idee = cache.find(x => String(x?.id) === idStr);
    openModal(idee || { id });
  });

  div.querySelector(".del")?.addEventListener("click", () => {
    if (!idStr) { toast("Erreur : id manquant", "delete"); return; }
    remove(id);
  });

  return div;
}

// =========================
// FILTRE
// =========================
function getFiltered() {
  let r = cache;

  if (filtre?.value) {
    r = r.filter(i => i.categorie === filtre.value);
  }

  if (search?.value) {
    const m = search.value.toLowerCase();
    r = r.filter(i =>
      i.titre.toLowerCase().includes(m) ||
      i.description.toLowerCase().includes(m)
    );
  }

  return r;
}

// =========================
// PAGINATION
// =========================
function renderPagination(total) {
  const paginationEl = $("pagination");
  if (!paginationEl) return;

  const size       = getPageSize();
  const totalPages = Math.ceil(total / size);

  if (totalPages <= 1) {
    paginationEl.style.display = "none";
    paginationEl.innerHTML = "";
    return;
  }

  paginationEl.style.display = "flex";
  page = Math.min(Math.max(page, 1), totalPages);

  const makeBtn = (label, n, disabled = false, active = false) => {
    const b = document.createElement("button");
    b.type        = "button";
    b.textContent = label;
    if (disabled) b.disabled = true;
    if (active)   b.classList.add("active");
    if (!disabled) {
      b.addEventListener("click", () => { page = n; render(); });
    }
    return b;
  };

  const dot = () => {
    const s = document.createElement("span");
    s.textContent = "…";
    s.style.cssText = "align-self:center; color:#64748b; font-weight:800;";
    return s;
  };

  const winSize = 5;
  let start = Math.max(1, page - Math.floor(winSize / 2));
  let end   = Math.min(totalPages, start + winSize - 1);
  start     = Math.max(1, end - winSize + 1);

  const parts = [];
  parts.push(makeBtn("←", page - 1, page <= 1));
  if (start > 1) parts.push(makeBtn("1", 1, false, page === 1));
  if (start > 2) parts.push(dot());
  for (let n = start; n <= end; n++) parts.push(makeBtn(String(n), n, false, n === page));
  if (end < totalPages - 1) parts.push(dot());
  if (end < totalPages) parts.push(makeBtn(String(totalPages), totalPages, false, page === totalPages));
  parts.push(makeBtn("→", page + 1, page >= totalPages));

  paginationEl.innerHTML = "";
  parts.forEach(p => paginationEl.appendChild(p));
}

// =========================
// RENDU
// =========================
function render() {
  const data = getFiltered();
  compteur.textContent = data.length;

  if (!data.length) {
    liste.innerHTML = "";
    vide.style.display = "flex";
    renderPagination(0);
    return;
  }

  vide.style.display = "none";

  const size      = getPageSize();
  const start     = (page - 1) * size;
  const pageData  = data.slice(start, start + size);

  liste.innerHTML = "";
  pageData.forEach(i => liste.appendChild(card(i)));
  renderPagination(data.length);
}

filtre?.addEventListener("change", () => { page = 1; render(); });
search?.addEventListener("input",  () => { page = 1; render(); });

// =========================
// REALTIME
// =========================
function startRealtime() {
  db.channel("idees-realtime")
    .on("postgres_changes", { event: "*", schema: "public", table: "idees" }, (payload) => {
      if (payload.eventType === "INSERT") {
        const existe = cache.find(i => i.id === payload.new.id);
        if (!existe) {
          cache.unshift({ ...payload.new, date: new Date(payload.new.created_at).toLocaleDateString("fr-FR") });
          render();
        }
      } else if (payload.eventType === "UPDATE") {
        const idx = cache.findIndex(i => i.id === payload.new.id);
        if (idx !== -1) {
          cache[idx] = { ...cache[idx], ...payload.new, date: new Date(payload.new.created_at).toLocaleDateString("fr-FR") };
          render();
        }
      } else if (payload.eventType === "DELETE") {
        if (cache.find(i => i.id === payload.old.id)) {
          cache = cache.filter(i => i.id !== payload.old.id);
          render();
        }
      }
    })
    .subscribe();
}

// =========================
// INIT
// =========================
document.addEventListener("DOMContentLoaded", async () => {
  cache = await loadIdees();
  updateCounters();
  render();
  startRealtime();
});