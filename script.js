/* ============================================================
   script.js — small interactions (not required for the layout)

   1) Highlight the nav link for the section you are viewing
   2) Theme button switches dark / light
   3) Sound button is a visual mute toggle (no real audio yet)
   4) Quest arrows scroll the project cards
   5) Konami Code (↑↑↓↓←→←→BA) shows a secret overlay
   6) Google Map pin — change LOCATION if you move
   ============================================================ */

const LOCATION = {
  city: "Grenaa",
  country: "Denmark",
  lat: 56.4157,
  lng: 10.8783,
  zoom: 12
};

function buildMapUrl({ lat, lng, zoom }) {
  return `https://www.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`;
}

function applyLocation() {
  const map = document.getElementById("location-map");
  const caption = document.getElementById("map-caption");
  if (map) map.src = buildMapUrl(LOCATION);
  if (caption) caption.textContent = `${LOCATION.city}, ${LOCATION.country}`;
}

const navLinks = document.querySelectorAll(".nav-link");
const sections = [...navLinks]
  .map((link) => {
    const id = link.dataset.section || (link.getAttribute("href") || "").slice(1);
    return document.getElementById(id);
  })
  .filter(Boolean);

let navLockUntil = 0;

function setActiveNav(sectionId) {
  navLinks.forEach((link) => {
    const id = link.dataset.section || (link.getAttribute("href") || "").slice(1);
    link.classList.toggle("is-active", id === sectionId);
  });
}

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    const href = link.getAttribute("href") || "";
    if (href.includes(".html")) return;
    const id = link.dataset.section || href.slice(1);
    navLockUntil = Date.now() + 900;
    setActiveNav(id);
  });
});

function activateFromScroll() {
  if (Date.now() < navLockUntil) return;
  const marker = 150;
  let current = sections[0]?.id;
  sections.forEach((section) => {
    if (section.getBoundingClientRect().top - marker <= 0) {
      current = section.id;
    }
  });
  if (current) setActiveNav(current);
}

if (document.body.dataset.page === "home") {
  window.addEventListener("scroll", activateFromScroll, { passive: true });
}

const profile = document.querySelector(".profile-photo");
if (profile) {
  const show = () => profile.classList.add("is-ready");
  if (profile.complete && profile.naturalWidth > 0) show();
  profile.addEventListener("load", show);
  profile.addEventListener("error", () => profile.classList.remove("is-ready"));
}

const themeBtn = document.getElementById("theme-toggle");
if (themeBtn) {
  themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("light");
  });
}

const soundBtn = document.getElementById("sound-toggle");
if (soundBtn) {
  soundBtn.addEventListener("click", () => {
    const on = soundBtn.getAttribute("aria-pressed") === "true";
    soundBtn.setAttribute("aria-pressed", String(!on));
    soundBtn.textContent = on ? "🔇" : "🔊";
  });
}

const track = document.getElementById("quest-track");
const prev = document.querySelector(".quest-arrow.prev");
const next = document.querySelector(".quest-arrow.next");
if (track && prev && next) {
  prev.addEventListener("click", () => {
    track.scrollBy({ left: -320, behavior: "smooth" });
  });
  next.addEventListener("click", () => {
    track.scrollBy({ left: 320, behavior: "smooth" });
  });
}

/* Konami Code: up up down down left right left right B A */
const sequence = [
  "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
  "KeyB", "KeyA"
];
let progress = 0;

document.addEventListener("keydown", (event) => {
  if (event.code === sequence[progress]) {
    progress += 1;
    if (progress === sequence.length) {
      progress = 0;
      const secret = document.getElementById("secret");
      if (!secret) return;
      secret.hidden = false;
      setTimeout(() => {
        secret.hidden = true;
      }, 2200);
    }
  } else {
    progress = 0;
  }
});

applyLocation();
if (document.body.dataset.page === "home") {
  activateFromScroll();
  loadQuestCovers();
}

async function loadQuestCovers() {
  const cards = [...document.querySelectorAll(".quest-card[data-gallery][data-album]")];
  if (!cards.length) return;

  const galleries = [...new Set(cards.map((card) => card.dataset.gallery))];
  const albumsByGallery = {};

  if (typeof getAlbumSummaries !== "function") return;

  try {
    await Promise.all(galleries.map(async (gallery) => {
      albumsByGallery[gallery] = await getAlbumSummaries(gallery);
    }));
  } catch {
    return;
  }

  cards.forEach((card) => {
    const album = (albumsByGallery[card.dataset.gallery] || [])
      .find((entry) => entry.id === card.dataset.album);
    const img = card.querySelector(".quest-cover");
    if (!img || !album?.coverUrl) return;
    img.alt = album.title || "";
    const show = () => img.classList.add("is-ready");
    img.addEventListener("load", show);
    if (img.complete && img.naturalWidth > 0) show();
    img.src = album.coverUrl;
  });
}
