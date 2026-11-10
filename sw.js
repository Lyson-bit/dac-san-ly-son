// Service worker – Đặc Sản Lý Sơn Quê Tôi
// Mỗi lần sửa trang: tăng số phiên bản CACHE (lyson-v63, v3...) để app trên điện thoại tự cập nhật.
const CACHE = "lyson-v63";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  // Chỉ lưu file của trang, phông chữ Google và thư viện bản đồ; bỏ qua ô bản đồ, tìm địa chỉ, YouTube
  const url = new URL(req.url);
  if (url.origin !== self.location.origin && !/fonts\.(googleapis|gstatic)\.com$|cdnjs\.cloudflare\.com$/.test(url.hostname)) return;

  // Trang HTML: lấy bản mới từ mạng, mất mạng thì dùng bản đã lưu
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put("./index.html", copy)); return res; })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // File khác (icon, font): dùng bản đã lưu trước, chưa có thì tải và lưu lại
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res && (res.ok || res.type === "opaque")) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    }))
  );
});
