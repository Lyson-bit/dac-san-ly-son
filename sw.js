// Service worker – Đặc Sản Lý Sơn Quê Tôi
// Mỗi lần sửa trang: tăng số phiên bản CACHE (lyson-v83, v3...) để app trên điện thoại tự cập nhật.
const CACHE = "lyson-v88";
// Ảnh để riêng, KHÔNG xóa khi cập nhật trang: khách quay lại không phải tải lại ảnh (tiết kiệm băng thông).
// Quy tắc: thay ảnh thì đặt TÊN FILE MỚI, đừng ghi đè ảnh cũ cùng tên.
const IMG = "lyson-img-1";
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
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== IMG).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  // Chỉ lưu file của trang, phông chữ Google và thư viện bản đồ; bỏ qua ô bản đồ, tìm địa chỉ, YouTube
  const url = new URL(req.url);
  if (url.origin !== self.location.origin && !/fonts\.(googleapis|gstatic)\.com$|cdnjs\.cloudflare\.com$/.test(url.hostname)) return;

  // Trang HTML: lấy bản mới từ mạng, mất mạng thì dùng bản đã lưu.
  // Trang chủ lưu vào "./index.html"; trang khác (hanh_trinh_3d.html) lưu theo đúng địa chỉ của nó,
  // để trang 3D không bao giờ ghi đè trang chủ khi mất mạng.
  if (req.mode === "navigate") {
    const home = url.origin === self.location.origin && /\/(index\.html)?$/.test(url.pathname);
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(home ? "./index.html" : req, copy)); }
          return res;
        })
        .catch(() => (home ? caches.match("./index.html") : caches.match(req).then((hit) => hit || caches.match("./index.html"))))
    );
    return;
  }

  // Ảnh, thư viện có số phiên bản trong tên (lib/three.r128.min.js) và thuyết minh (audio/tm1_*.mp3): lưu ở kho riêng, giữ qua các bản cập nhật
  if (url.origin === self.location.origin && (url.pathname.indexOf("/images/") >= 0 || url.pathname.indexOf("/lib/") >= 0 || url.pathname.indexOf("/audio/") >= 0)) {
    e.respondWith(
      caches.open(IMG).then((c) => c.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res && res.ok) c.put(req, res.clone());
        return res;
      })))
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
