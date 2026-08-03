// ============================================================
// 🔴 अपना REAL .m3u8 लिंक यहाँ डालें
// ============================================================
const DEFAULT_VIDEO_URL = "https://vs.classplusapp.com/hls/6a7089aae86acfbc9dbb33f5/index.m3u8";

const video = document.getElementById('videoPlayer');
const viewerCountEl = document.getElementById('viewerCount');
const errorMsg = document.getElementById('errorMsg');

// ============================================================
// 👁️ लाइव व्यूअर काउंट (सिम्युलेटेड)
// ============================================================
function startViewerCounter() {
  let count = Math.floor(Math.random() * 40) + 12;
  viewerCountEl.textContent = count;

  setInterval(() => {
    let change = Math.floor(Math.random() * 7) - 3;
    let newCount = parseInt(viewerCountEl.textContent) + change;
    if (newCount < 5) newCount = 5 + Math.floor(Math.random() * 10);
    if (newCount > 150) newCount = 120 + Math.floor(Math.random() * 30);
    viewerCountEl.textContent = newCount;
  }, 7000);
}
startViewerCounter();

// ============================================================
// 🎬 सीधा वीडियो लोड करें (बिना किसी Proxy के)
// ============================================================
function loadVideo(url) {
  if (!url) {
    errorMsg.textContent = "❌ URL खाली है!";
    errorMsg.classList.add('show');
    return;
  }

  errorMsg.classList.remove('show');

  // सीधा video.src में लिंक डालें
  video.src = url;
  video.load();
  
  video.play().catch(function(e) {
    console.warn('⚠️ Autoplay blocked:', e);
    errorMsg.textContent = "⚠️ ऑटोप्ले ब्लॉक हो गया। प्ले बटन दबाएँ।";
    errorMsg.classList.add('show');
  });

  // वीडियो लोड होने पर
  video.addEventListener('loadedmetadata', function() {
    console.log('✅ वीडियो लोड हो गया!');
    errorMsg.classList.remove('show');
  });

  // एरर हैंडलिंग
  video.addEventListener('error', function(e) {
    console.error('❌ वीडियो एरर:', e);
    errorMsg.textContent = "❌ वीडियो लोड नहीं हुआ। लिंक एक्सपायर हो सकता है।";
    errorMsg.classList.add('show');
  });

  // बफरिंग चेक
  video.addEventListener('waiting', function() {
    console.log('⏳ बफर हो रहा है...');
  });

  video.addEventListener('playing', function() {
    console.log('▶️ वीडियो चल रहा है');
  });
}

// ============================================================
// 🚀 पेज खुलते ही DEFAULT लिंक लोड करें
// ============================================================
window.addEventListener('load', function() {
  if (DEFAULT_VIDEO_URL && DEFAULT_VIDEO_URL !== "https://example.com/stream.m3u8") {
    loadVideo(DEFAULT_VIDEO_URL);
  } else {
    errorMsg.textContent = "❌ कृपया script.js में DEFAULT_VIDEO_URL में .m3u8 लिंक डालें।";
    errorMsg.classList.add('show');
  }
});

console.log('✅ लाइव स्ट्रीम वेबसाइट तैयार है!');
console.log('📺 लिंक:', DEFAULT_VIDEO_URL);
