// ============================================================
// 🔴 अपना REAL .m3u8 लिंक यहाँ डालें
// ============================================================
const DEFAULT_VIDEO_URL = "https://vs.classplusapp.com/hls/6a7089aae86acfbc9dbb33f5/index.m3u8";

let hls = null;
let reloadAttempts = 0;
const MAX_RELOAD_ATTEMPTS = 100;

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
// 🎬 hls.js के साथ वीडियो लोड करें (बिना CORS Proxy के)
// ============================================================
function loadVideo(url) {
  if (!url) {
    errorMsg.textContent = "❌ URL खाली है!";
    errorMsg.classList.add('show');
    return;
  }

  errorMsg.classList.remove('show');

  // पुराने HLS को डिस्ट्रॉय करें
  if (hls) {
    hls.destroy();
    hls = null;
  }

  // Safari / iOS - Native HLS
  if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = url;
    video.play().catch(function(e) {
      console.warn('Autoplay blocked:', e);
    });
    return;
  }

  // बाकी ब्राउज़र - hls.js
  if (Hls.isSupported()) {
    hls = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
      maxBufferLength: 60,
      maxMaxBufferLength: 120,
      maxBufferSize: 60 * 1000 * 1000,
      startFragPrefetch: true,
      testBandwidth: true,
      abrEwmaDefaultEstimate: 500000,
      abrEwmaFastLive: 3.0,
      abrEwmaSlowLive: 9.0,
      liveDurationInfinity: true,
      liveMaxLatencyDurationCount: 5,
      liveSyncDurationCount: 5,
      fragLoadingTimeOut: 30000,
      manifestLoadingTimeOut: 30000,
      levelLoadingTimeOut: 30000,
    });

    hls.loadSource(url);
    hls.attachMedia(video);

    hls.on(Hls.Events.MANIFEST_PARSED, function() {
      console.log('✅ मैनिफेस्ट पार्स हो गया');
      video.play().catch(function(e) {
        console.warn('Autoplay blocked:', e);
      });
    });

    // फ्रैगमेंट लोड होने पर
    hls.on(Hls.Events.FRAG_LOADED, function() {
      console.log('📦 फ्रैगमेंट लोड हो गया');
    });

    // एरर हैंडलिंग - ऑटो रिकवरी
    hls.on(Hls.Events.ERROR, function(event, data) {
      console.log('⚠️ एरर:', data.type, data.details);

      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            console.log('🔄 नेटवर्क एरर, रिकवर कर रहे हैं...');
            hls.startLoad();
            break;

          case Hls.ErrorTypes.MEDIA_ERROR:
            console.log('🔄 मीडिया एरर, रिकवर कर रहे हैं...');
            hls.recoverMediaError();
            break;

          default:
            if (reloadAttempts < MAX_RELOAD_ATTEMPTS) {
              reloadAttempts++;
              console.log(`🔄 रिलोड ${reloadAttempts}/${MAX_RELOAD_ATTEMPTS}...`);
              setTimeout(function() {
                loadVideo(url);
              }, 3000);
            } else {
              errorMsg.textContent = "❌ बार-बार रिलोड करने पर भी वीडियो नहीं चल रहा। नया लिंक डालें।";
              errorMsg.classList.add('show');
            }
            break;
        }
      }
    });

    // बफर स्टॉल होने पर रिकवर
    hls.on(Hls.Events.BUFFER_STALLED, function() {
      console.log('🔄 बफर स्टॉल हो गया, रिकवर कर रहे हैं...');
      if (hls) {
        hls.startLoad();
      }
    });

  } else {
    errorMsg.textContent = "❌ आपका ब्राउज़र HLS सपोर्ट नहीं करता।";
    errorMsg.classList.add('show');
  }
}

// ============================================================
// 🚀 पेज लोड होने पर वीडियो लोड करें
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
  if (DEFAULT_VIDEO_URL && DEFAULT_VIDEO_URL !== "https://example.com/stream.m3u8") {
    loadVideo(DEFAULT_VIDEO_URL);
  } else {
    errorMsg.textContent = "❌ कृपया script.js में DEFAULT_VIDEO_URL में .m3u8 लिंक डालें।";
    errorMsg.classList.add('show');
  }
});

console.log('✅ लाइव स्ट्रीम वेबसाइट तैयार है!');
console.log('📺 लिंक:', DEFAULT_VIDEO_URL);
