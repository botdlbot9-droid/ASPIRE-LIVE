// ============================================================
// 🔴 अपना .m3u8 लिंक यहाँ डालें
// ============================================================
const DEFAULT_VIDEO_URL = "https://vs.classplusapp.com/hls/6a7089aae86acfbc9dbb33f5/index.m3u8";

// CORS Proxy (ClassPlus के CORS को बायपास करने के लिए)
// इनमें से कोई एक Proxy इस्तेमाल करें:
const CORS_PROXY = "https://api.allorigins.win/raw?url=";
// या
const CORS_PROXY = "https://corsproxy.io/?url=";
// या
const CORS_PROXY = "https://proxy.cors.sh/";
// या
const CORS_PROXY = "https://cors-anywhere.herokuapp.com/";

let hls = null;
let reloadAttempts = 0;
const MAX_RELOAD_ATTEMPTS = 20;
const video = document.getElementById('videoPlayer');
const viewerCountEl = document.getElementById('viewerCount');
const errorMsg = document.getElementById('errorMsg');
const statusMsg = document.getElementById('statusMsg');

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
// 🎬 CORS Proxy के साथ वीडियो लोड करें
// ============================================================
function loadVideo(url) {
  if (!url) return;

  errorMsg.classList.remove('show');
  statusMsg.classList.remove('show');
  reloadAttempts = 0;

  if (hls) {
    hls.destroy();
    hls = null;
  }

  // CORS Proxy URL बनाएँ
  const proxyUrl = CORS_PROXY + encodeURIComponent(url);
  console.log('📺 Proxy URL:', proxyUrl);

  // Safari / iOS (Native HLS) - Proxy के साथ
  if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = proxyUrl;
    video.play().catch(function(e) {
      console.warn('Autoplay blocked:', e);
    });
    return;
  }

  // बाकी ब्राउज़र (hls.js) - CORS Proxy के साथ
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
      liveMaxLatencyDurationCount: 3,
      liveSyncDurationCount: 3,
      // ✅ CORS Proxy के साथ काम करने के लिए
      xhrSetup: function(xhr, url) {
        // Proxy URL को ही use करें
        console.log('📡 XHR Request:', url);
      }
    });

    // Proxy URL के साथ लोड करें
    hls.loadSource(proxyUrl);
    hls.attachMedia(video);

    hls.on(Hls.Events.MANIFEST_PARSED, function() {
      video.play().catch(function(e) {
        console.warn('Autoplay blocked:', e);
      });
    });

    // ✅ एरर हैंडलिंग
    hls.on(Hls.Events.ERROR, function(event, data) {
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            console.log('🔄 नेटवर्क एरर, रिकवर कर रहे हैं...');
            statusMsg.textContent = '🔄 कनेक्शन पुनः स्थापित किया जा रहा है...';
            statusMsg.classList.add('show');
            hls.startLoad();
            break;
            
          case Hls.ErrorTypes.MEDIA_ERROR:
            console.log('🔄 मीडिया एरर, रिकवर कर रहे हैं...');
            statusMsg.textContent = '🔄 मीडिया पुनः लोड किया जा रहा है...';
            statusMsg.classList.add('show');
            hls.recoverMediaError();
            break;
            
          default:
            console.log('🔄 एरर, पुनः लोड कर रहे हैं...');
            errorMsg.textContent = '❌ वीडियो लोड नहीं हुआ। पुनः प्रयास कर रहे हैं...';
            errorMsg.classList.add('show');
            
            if (reloadAttempts < MAX_RELOAD_ATTEMPTS) {
              reloadAttempts++;
              setTimeout(function() {
                loadVideo(url);
              }, 2000);
            } else {
              errorMsg.textContent = '❌ बार-बार रिलोड करने पर भी वीडियो नहीं चल रहा। नया लिंक डालें।';
              errorMsg.classList.add('show');
            }
            break;
        }
      }
    });

    // ✅ बफर स्टॉल होने पर रिकवर
    hls.on(Hls.Events.BUFFER_STALLED, function() {
      console.log('🔄 बफर स्टॉल हो गया, रिकवर कर रहे हैं...');
      statusMsg.textContent = '🔄 बफर रिफ्रेश किया जा रहा है...';
      statusMsg.classList.add('show');
      if (hls) {
        hls.startLoad();
      }
    });

    // ✅ रिकवर होने पर स्टेटस मैसेज हटाएँ
    hls.on(Hls.Events.LEVEL_LOADED, function() {
      statusMsg.classList.remove('show');
      errorMsg.classList.remove('show');
    });

  } else {
    errorMsg.textContent = "❌ आपका ब्राउज़र HLS सपोर्ट नहीं करता।";
    errorMsg.classList.add('show');
  }
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

// ============================================================
// 🔄 अगर वीडियो रुक जाए तो ऑटो-रिलोड
// ============================================================
setInterval(function() {
  if (video && video.paused && video.currentTime > 0 && !video.ended && video.readyState < 2) {
    console.log('🔄 वीडियो रुका हुआ है, रिलोड कर रहे हैं...');
    const currentSrc = DEFAULT_VIDEO_URL;
    if (currentSrc && currentSrc !== "https://example.com/stream.m3u8") {
      loadVideo(currentSrc);
    }
  }
}, 5000);

console.log('✅ लाइव स्ट्रीम वेबसाइट तैयार है! (CORS Proxy के साथ)');
console.log('📺 लिंक:', DEFAULT_VIDEO_URL);
