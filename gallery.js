const GALLERY_PAGES = {
  photography: { href: "photography.html", label: "Photography" },
  sketchbook: { href: "sketchbook.html", label: "Sketchbook" },
  workshop: { href: "workshop.html", label: "Workshop" }
};

function pageQuery() {
  return new URLSearchParams(window.location.search);
}

function currentCategory() {
  return document.body.dataset.category || pageQuery().get("gallery") || "";
}

function currentView() {
  return document.body.dataset.view || "albums";
}

function currentAlbumId() {
  return document.body.dataset.album || pageQuery().get("album") || "";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function loadGalleryPage() {
  const grid = document.getElementById("gallery-grid");
  if (!grid) return;

  const category = currentCategory();
  if (!category) return;

  try {
    if (currentView() === "album" && currentAlbumId()) {
      await loadAlbum(category, currentAlbumId(), grid);
    } else {
      await loadAlbums(category, grid);
    }
  } catch {
    renderEmpty(grid, "Could not load this gallery. Check data/gallery.json on GitHub Pages.");
  }
}

async function loadAlbums(category, grid) {
  const albums = await getAlbumSummaries(category);
  renderAlbums(category, grid, albums);
}

async function loadAlbum(category, albumId, grid) {
  const data = await getAlbum(category, albumId);
  const parent = GALLERY_PAGES[category];
  const albumTitle = document.getElementById("album-title");
  const albumIntro = document.getElementById("album-intro");
  const albumBack = document.getElementById("album-back");

  if (albumTitle) albumTitle.textContent = data.album?.title || "Album";
  if (albumIntro) {
    albumIntro.textContent = data.album?.description || "All photos in this album.";
  }
  if (albumBack && parent) {
    albumBack.href = parent.href;
    albumBack.textContent = `‹ Back to ${parent.label}`;
  }
  document.title = `${data.album?.title || "Album"} — NICO`;
  renderPhotos(grid, data.items || []);
}

function renderEmpty(grid, message) {
  grid.innerHTML = "";
  const empty = document.getElementById("gallery-empty");
  if (empty) {
    empty.hidden = false;
    empty.textContent = message;
  }
}

function renderAlbums(category, grid, albums) {
  const empty = document.getElementById("gallery-empty");
  grid.innerHTML = "";
  if (!albums.length) {
    renderEmpty(grid, "No albums yet.");
    return;
  }
  if (empty) empty.hidden = true;

  albums.forEach((album) => {
    const link = document.createElement("a");
    link.className = "album-card";
    link.href = `album.html?gallery=${encodeURIComponent(category)}&album=${encodeURIComponent(album.id)}`;
    const cover = album.coverUrl
      ? `<img src="${escapeHtml(album.coverUrl)}" alt="">`
      : `<div class="album-cover-empty" aria-hidden="true"></div>`;
    link.innerHTML = `
      ${cover}
      <div class="album-meta">
        <h2>${escapeHtml(album.title)}</h2>
        <p>${escapeHtml(album.description || "")}</p>
        <span>${album.count || 0} photos · Open album ›</span>
      </div>
    `;
    grid.appendChild(link);
  });
}

function renderPhotos(grid, items) {
  const empty = document.getElementById("gallery-empty");
  grid.innerHTML = "";
  if (!items.length) {
    renderEmpty(grid, "This album is empty for now.");
    return;
  }
  if (empty) empty.hidden = true;

  items.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "gallery-item album-photo";
    button.innerHTML = `<img src="${escapeHtml(item.url)}" alt="${escapeHtml(item.originalName || "Artwork")}">`;
    button.addEventListener("click", () => openLightbox(item));
    grid.appendChild(button);
  });
}

function openLightbox(item) {
  const lightbox = document.getElementById("lightbox");
  const lightboxImage = document.getElementById("lightbox-image");
  if (!lightbox || !lightboxImage) return;
  lightboxImage.src = item.url;
  lightboxImage.alt = item.originalName || "Artwork";
  lightbox.hidden = false;
}

function closeLightbox() {
  const lightbox = document.getElementById("lightbox");
  const lightboxImage = document.getElementById("lightbox-image");
  if (!lightbox || !lightboxImage) return;
  lightbox.hidden = true;
  lightboxImage.src = "";
}

document.getElementById("lightbox-close")?.addEventListener("click", closeLightbox);
document.getElementById("lightbox")?.addEventListener("click", (event) => {
  if (event.target.id === "lightbox") closeLightbox();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeLightbox();
});

loadGalleryPage();
