// Confirguration
const CATEGORIES = {
  "Pédagogie": { couleur: "#aa0909", icone: "fa-book" },
  "Événement": { couleur: "#FFA94D", icone: "fa-calendar" },
  "Vie de campus": { couleur: "#51CF66", icone: "fa-building" },
  "Amélioration technique": { couleur: "#4C9AFF", icone: "fa-code" }
};

// =========================
// DOM
// =========================
const modal = document.getElementById("modal");
const formeIdee = document.getElementById("formeIdee");
const listeIdees = document.getElementById("listeIdees");
const etatVide = document.getElementById("etatVide");
const compteurIdees = document.getElementById("compteurIdees");
const ouvrirModal = document.getElementById("ouvrirModal");
const btnPartager = document.getElementById("btnPartager");
const fermerModal = document.getElementById("fermerModal");
const annulerModal = document.getElementById("annulerModal");
const titreModal = document.getElementById("titreModal");
const filtreCategorie = document.getElementById("filtreCategorie");
const recherche = document.getElementById("recherche");
const btnVide = document.getElementById("btnVide");
const champTitre = document.getElementById("titre");
const champCategorie = document.getElementById("categorie");
const champDescription = document.getElementById("description");

let ideeEnCours = null;

// Pagination
const PAGE_SIZE = 8;
let pageCourante = 1;
const paginationEl = document.getElementById("pagination");

// =========================
// Supabase client
// =========================
// IMPORTANT: pour que ce code marche, il faut ajouter dans index.html:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
// puis fournir SUPABASE_URL et SUPABASE_ANON_KEY via le scope window.

const SUPABASE_URL = window.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || "";

let supabase = null;
let ideesCache = [];
let realtimeSub = null;

function setupSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn("Supabase: SUPABASE_URL ou SUPABASE_ANON_KEY manquant.");
    return;
  }

  if (!window.supabase || !window.supabase.createClient) {
    console.warn(
      "Supabase client introuvable (ajoute le script CDN @supabase/supabase-js@2 dans index.html)."
    );
    return;
  }

  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

async function chargerIdeesSupabase() {
  if (!supabase) throw new Error("Supabase non initialisé.");

  const { data, error } = await supabase
    .from("idees")
    .select("id, titre, categorie, description, date_creation")
    .order("date_creation", { ascending: false });

  if (error) throw error;

  ideesCache = (data || []).map((row) => ({
    id: row.id,
    titre: row.titre,
    categorie: row.categorie,
    description: row.description,
    dateCreation: row.date_creation ? new Date(row.date_creation).toLocaleDateString("fr-FR") : ""
  }));

  return ideesCache;
}

function formatCategorieSafe(categorie) {
  // Normalise pour rester compatible avec l’ancien select ("Technique" -> "Amélioration technique")
  if (categorie === "Technique") return "Amélioration technique";
  return categorie;
}

function getCouleurEtIcone(categorie) {
  const cat = formatCategorieSafe(categorie);
  const def = CATEGORIES["Amélioration technique"];
  return CATEGORIES[cat] ? CATEGORIES[cat] : def;
}

// =========================
// UI helpers
// =========================
function showToast(type, message) {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    toast.style.transition = "0.3s ease";
    toast.remove();
  }, 3200);
}

function echapperHTML(texte) {
  const div = document.createElement("div");
  div.textContent = texte;
  return div.innerHTML;
}

function ouvrirModalForm(idee = null) {
  ideeEnCours = idee;

  if (idee) {
    titreModal.textContent = "Modifier l'idée";
    champTitre.value = idee.titre;
    champCategorie.value = idee.categorie;
    champDescription.value = idee.description;
  } else {
    titreModal.textContent = "Ajouter une idée";
    formeIdee.reset();

    // Catégorie par défaut (phase migration Supabase)
    if (champCategorie) {
      champCategorie.value = "Amélioration technique";
    }
  }

  modal.classList.add("modal--active");
}

function fermerModalForm() {
  modal.classList.remove("modal--active");
  formeIdee.reset();
  ideeEnCours = null;
}

ouvrirModal.addEventListener("click", () => ouvrirModalForm());
btnPartager.addEventListener("click", () => ouvrirModalForm());
btnVide.addEventListener("click", () => ouvrirModalForm());
fermerModal.addEventListener("click", fermerModalForm);
annulerModal.addEventListener("click", fermerModalForm);

// =========================
// CRUD Supabase
// =========================
function setFormBusy(busy) {
  const submitBtn = formeIdee.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = busy;
  champTitre.disabled = busy;
  champCategorie.disabled = busy;
  champDescription.disabled = busy;
}

async function ajouterOuModifierIdee(e) {
  e.preventDefault();

  const titre = champTitre.value.trim();
  const categorie = formatCategorieSafe(champCategorie.value);
  const description = champDescription.value.trim();

  if (!titre || !categorie || !description) {
    alert("Tous les champs sont obligatoires");
    return;
  }

  if (!supabase) {
    showToast("delete", "Supabase non configuré. Ajoute SUPABASE_URL et SUPABASE_ANON_KEY.");
    return;
  }

  setFormBusy(true);

  try {
    if (ideeEnCours) {
      const { error } = await supabase
        .from("idees")
        .update({ titre, categorie, description })
        .eq("id", ideeEnCours.id);

      if (error) throw error;

      showToast("edit", "Idée modifiée avec succès");
    } else {
      // Phase 1: catégorie depuis le select (catégorisation IA branchée plus tard)
      const { error } = await supabase.from("idees").insert({
        titre,
        categorie,
        description
      });

      if (error) throw error;

      showToast("success", "Idée ajoutée avec succès");
    }

    fermerModalForm();
    pageCourante = 1;

    // Recharger (Realtime re-synchronisera aussi, mais recharge immédiat pour UX)
    await chargerIdeesSupabase();
    afficherIdees();
  } catch (err) {
    console.error(err);
    showToast("delete", "Erreur lors de l'opération Supabase.");
  } finally {
    setFormBusy(false);
  }
}

async function supprimerIdee(id) {
  if (!confirm("Êtes-vous sûr de vouloir supprimer cette idée ?")) return;
  if (!supabase) return;

  setFormBusy(true);
  try {
    const { error } = await supabase.from("idees").delete().eq("id", id);
    if (error) throw error;

    showToast("delete", "Idée supprimée");
    // Recharger pour synchroniser immédiatement
    await chargerIdeesSupabase();
    afficherIdees();
  } catch (err) {
    console.error(err);
    showToast("delete", "Erreur lors de la suppression.");
  } finally {
    setFormBusy(false);
  }
}

formeIdee.addEventListener("submit", ajouterOuModifierIdee);

// =========================
// Affichage
// =========================
function creerCarteIdee(idee) {
  const { couleur, icone } = getCouleurEtIcone(idee.categorie);

  const carte = document.createElement("div");
  carte.className = "carte";
  carte.style.borderTopColor = couleur;
  carte.style.backgroundColor = couleur + "15";

  carte.innerHTML = `
    <div class="carte__entete">
      <div class="carte__categorie">
        <i class="fas ${icone}"></i>
        <span>${echapperHTML(formatCategorieSafe(idee.categorie))}</span>
      </div>
      <span class="carte__date">${echapperHTML(idee.dateCreation || "")}</span>
    </div>

    <h3 class="carte__titre">${echapperHTML(idee.titre)}</h3>

    <p class="carte__description">${echapperHTML(idee.description)}</p>

    <div class="carte__actions">
      <button class="btn-action btn-action--edit" title="Éditer" aria-label="Éditer">
        <i class="fas fa-pencil"></i>
      </button>
      <button class="btn-action btn-action--delete" title="Supprimer" aria-label="Supprimer">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `;

  carte.querySelector(".btn-action--edit").addEventListener("click", () => {
    ouvrirModalForm(idee);
  });

  carte.querySelector(".btn-action--delete").addEventListener("click", () => {
    supprimerIdee(idee.id);
  });

  return carte;
}

function getIdeesFiltrees(idees) {
  let ideesFiltrees = idees;

  const categorieFiltree = filtreCategorie.value;
  if (categorieFiltree) {
    ideesFiltrees = ideesFiltrees.filter((idea) => formatCategorieSafe(idea.categorie) === categorieFiltree);
  }

  const rechercheMot = recherche.value.toLowerCase();
  if (rechercheMot) {
    ideesFiltrees = ideesFiltrees.filter(
      (idea) =>
        idea.titre.toLowerCase().includes(rechercheMot) ||
        idea.description.toLowerCase().includes(rechercheMot)
    );
  }

  return ideesFiltrees;
}

function afficherPagination(total, page) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (total <= PAGE_SIZE) {
    paginationEl.style.display = "none";
    paginationEl.innerHTML = "";
    return;
  }

  paginationEl.style.display = "flex";
  paginationEl.innerHTML = "";

  const creerBouton = ({ label, actif, desactive, onClick }) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = label;
    if (actif) btn.classList.add("active");
    if (desactive) btn.disabled = true;
    if (onClick) btn.addEventListener("click", onClick);
    return btn;
  };

  paginationEl.appendChild(
    creerBouton({
      label: "←",
      desactive: page === 1,
      onClick: () => {
        pageCourante = Math.max(1, pageCourante - 1);
        afficherIdees();
      },
    })
  );

  const start = Math.max(1, pageCourante - 2);
  const end = Math.min(totalPages, start + 4);
  const startFix = Math.max(1, end - 4);

  for (let p = startFix; p <= end; p++) {
    paginationEl.appendChild(
      creerBouton({
        label: String(p),
        actif: p === pageCourante,
        onClick: () => {
          pageCourante = p;
          afficherIdees();
        },
      })
    );
  }

  paginationEl.appendChild(
    creerBouton({
      label: "→",
      desactive: pageCourante >= totalPages,
      onClick: () => {
        pageCourante = Math.min(totalPages, pageCourante + 1);
        afficherIdees();
      },
    })
  );
}

function afficherIdees(idees = ideesCache) {
  const ideesFiltrees = getIdeesFiltrees(idees);
  compteurIdees.textContent = ideesFiltrees.length;

  if (ideesFiltrees.length === 0) {
    listeIdees.innerHTML = "";
    etatVide.style.display = "flex";
    paginationEl.style.display = "none";
    paginationEl.innerHTML = "";
    return;
  }

  etatVide.style.display = "none";

  const totalPages = Math.max(1, Math.ceil(ideesFiltrees.length / PAGE_SIZE));
  if (pageCourante > totalPages) pageCourante = totalPages;

  const debut = (pageCourante - 1) * PAGE_SIZE;
  const fin = debut + PAGE_SIZE;
  const pageItems = ideesFiltrees.slice(debut, fin);

  listeIdees.innerHTML = "";
  pageItems.forEach((idee) => listeIdees.appendChild(creerCarteIdee(idee)));

  afficherPagination(ideesFiltrees.length, pageCourante);
}

// =========================
// Filtres
// =========================
filtreCategorie.addEventListener("change", () => {
  pageCourante = 1;
  afficherIdees();
});

recherche.addEventListener("input", () => {
  pageCourante = 1;
  afficherIdees();
});

// =========================
// Modal close
// =========================
modal.addEventListener("click", (e) => {
  if (e.target === modal) fermerModalForm();
});

// =========================
// Realtime
// =========================
function initRealtime() {
  if (!supabase) return;

  if (realtimeSub) {
    supabase.removeChannel(realtimeSub);
  }

  realtimeSub = supabase
    .channel("realtime-idees")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "idees" },
      async () => {
        // Recharger et rerendre
        try {
          await chargerIdeesSupabase();
          afficherIdees();
        } catch (err) {
          console.error("Realtime reload failed", err);
        }
      }
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log("Realtime: connected");
      }
    });
}

// =========================
// init
// =========================
document.addEventListener("DOMContentLoaded", async () => {
  setupSupabase();

  if (!supabase) {
    // Fallback UX: affiche un message au lieu de crash
    console.warn("Supabase non initialisé. Migration incomplète.");
    etatVide.style.display = "flex";
    paginationEl.style.display = "none";
    return;
  }

  try {
    await chargerIdeesSupabase();
    afficherIdees();
    initRealtime();
  } catch (err) {
    console.error(err);
    etatVide.style.display = "flex";
    paginationEl.style.display = "none";
    compteurIdees.textContent = "0";
  }
});

