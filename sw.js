// DexoLive xizmat fayli: faqat PWA/APK talabi uchun. Hech narsani keshlamaydi,
// shuning uchun yangilangan kod odamlarga darrov yetib boradi.
self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
self.addEventListener("fetch",()=>{});
