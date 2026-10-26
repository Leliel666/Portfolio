function siteBase() {
  const parts = window.location.pathname.split("/");
  const last = parts.pop() || "";
  if (last.includes(".") || last === "") {
    return `${parts.join("/")}/`;
  }
  return `${parts.concat(last).join("/")}/`;
}

function mediaUrl(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return siteBase() + String(url).replace(/^\//, "");
}

function withMedia(item) {
  return { ...item, url: mediaUrl(item.url || item.file) };
}

async function getGalleryData() {
  if (getGalleryData.cache) return getGalleryData.cache;
  const response = await fetch(`${siteBase()}data/gallery.json`, { cache: "no-store" });
  if (!response.ok) throw new Error("Could not load gallery data");
  getGalleryData.cache = await response.json();
  return getGalleryData.cache;
}

function gallerySection(data, category) {
  const section = data?.[category];
  if (!section) return { albums: [], items: [] };
  if (Array.isArray(section)) return { albums: [], items: section };
  return {
    albums: Array.isArray(section.albums) ? section.albums : [],
    items: Array.isArray(section.items) ? section.items : []
  };
}

async function getAlbumSummaries(category) {
  const section = gallerySection(await getGalleryData(), category);
  return section.albums.map((album) => {
    const photos = section.items.filter((item) => item.albumId === album.id).map(withMedia);
    return {
      ...album,
      count: photos.length,
      coverUrl: photos[0]?.url || ""
    };
  });
}

async function getAlbum(category, albumId) {
  const section = gallerySection(await getGalleryData(), category);
  const album = section.albums.find((entry) => entry.id === albumId);
  if (!album) throw new Error("Unknown album");
  return {
    album,
    items: section.items.filter((item) => item.albumId === albumId).map(withMedia)
  };
}
