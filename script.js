// ============================================================
// 🔴 अपना REAL .m3u8 लिंक यहाँ डालें
// ============================================================
const DEFAULT_VIDEO_URL = "https://vs.classplusapp.com/hls/6a7089aae86acfbc9dbb33f5/index.m3u8";

// CORS Proxy - CORS एरर को बायपास करने के लिए
// अगर कोई Proxy काम न करे तो दूसरा try करें
const CORS_PROXY = "https://corsproxy.io/?url=";

let hls = null;
let reloadAttempts = 0;
const MAX_RELOAD_ATTEMPTS = 50;
let isRecovering = false;

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
// 🎬 वीडियो लोड करें (CORS Proxy + बेहतर सेटिंग्स के साथ)
// ============================================================
function loadVideo(url) {
  if (!url) {
    console.error('❌ URL खाली है!');
    return;
  }

  errorMsg.classList.remove('show');
  statusMsg.classList.remove('show');
  isRecovering = false;

  if (hls) {
    hls.destroy();
    hls = null;
  }

  // CORS Proxy URL बनाएँ
  const proxyUrl = CORS_PROXY + encodeURIComponent(url);
  console.log('📺 लोड हो रहा है:', proxyUrl);

  // Safari / iOS (Native HLS)
  if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = proxyUrl;
    video.play().catch(function(e) {
      console.warn('⚠️ Autoplay blocked:', e);
    });
    return;
  }

  // बाकी ब्राउज़र (hls.js)
  if (Hls.isSupported()) {
    hls = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
      maxBufferLength: 90,              // बफर बढ़ाया
      maxMaxBufferLength: 180,
      maxBufferSize: 90 * 1000 * 1000,
      startFragPrefetch: true,
      testBandwidth: true,
      abrEwmaDefaultEstimate: 500000,
      abrEwmaFastLive: 3.0,
      abrEwmaSlowLive: 9.0,
      liveDurationInfinity: true,
      liveMaxLatencyDurationCount: 5,
      liveSyncDurationCount: 5,
      fragLoadingTimeOut: 20000,        // 20 सेकंड टाइमआउट
      manifestLoadingTimeOut: 20000,
      levelLoadingTimeOut: 20000,
    });

    hls.loadSource(proxyUrl);
    hls.attachMedia(video);

    // ✅ मैनिफेस्ट पार्स होने पर प्ले करें
    hls.on(Hls.Events.MANIFEST_PARSED, function() {
      console.log('✅ मैनिफेस्ट पार्स हो गया, प्ले कर रहे हैं...');
      video.play().catch(function(e) {
        console.warn('⚠️ Autoplay blocked:', e);
      });
    });

    // ✅ फ्रैगमेंट लोड होने पर (बफर भर रहा है)
    hls.on(Hls.Events.FRAG_LOADED, function() {
      if (isRecovering) {
        isRecovering = false;
        statusMsg.classList.remove('show');
      }
    });

    // ✅ एरर हैंडलिंग - ऑटो रिकवरी
    hls.on(Hls.Events.ERROR, function(event, data) {
      console.log('⚠️ एरर:', data.type, data.details);

      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            console.log('🔄 नेटवर्क एरर, रिकवर कर रहे हैं...');
            showStatus('🔄 कनेक्शन पुनः स्थापित किया जा रहा है...');
            isRecovering = true;
            hls.startLoad();
            break;

          case Hls.ErrorTypes.MEDIA_ERROR:
            console.log('🔄 मीडिया एरर, रिकवर कर रहे हैं...');
            showStatus('🔄 मीडिया पुनः लोड किया जा रहा है...');
            isRecovering = true;
            hls.recoverMediaError();
            break;

          default:
            // अन्य एरर - रिलोड
            if (reloadAttempts < MAX_RELOAD_ATTEMPTS) {
              reloadAttempts++;
              console.log(`🔄 पुनः प्रयास ${reloadAttempts}/${MAX_RELOAD_ATTEMPTS}...`);
              showStatus(`🔄 पुनः प्रयास ${reloadAttempts}/${MAX_RELOAD_ATTEMPTS}...`);
              setTimeout(function() {
                loadVideo(url);
              }, 3000);
            } else {
              showError('❌ बार-बार रिलोड करने पर भी वीडियो नहीं चल रहा। नया लिंक डालें।');
            }
            break;
        }
      } else {
        // नॉन-फेटल एरर - इग्नोर
        console.log('⚠️ नॉन-फेटल एरर, इग्नोर कर रहे हैं...');
      }
    });

    // ✅ बफर स्टॉल होने पर रिकवर
    hls.on(Hls.Events.BUFFER_STALLED, function() {
      console.log('🔄 बफर स्टॉल हो गया, रिकवर कर रहे हैं...');
      showStatus('🔄 बफर रिफ्रेश किया जा रहा है...');
      isRecovering = true;
      if (hls) {
        hls.startLoad();
      }
    });

    // ✅ लेवल लोड होने पर स्टेटस हटाएँ
    hls.on(Hls.Events.LEVEL_LOADED, function() {
      if (isRecovering) {
        isRecovering = false;
        statusMsg.classList.remove('show');
        errorMsg.classList.remove('show');
      }
    });

  } else {
    showError('❌ आपका ब्राउज़र HLS सपोर्ट नहीं करता।');
  }
}

// ============================================================
// 📢 स्टेटस और एरर मैसेज हेल्पर फंक्शन
// ============================================================
function showStatus(msg) {
  statusMsg.textContent = msg;
  statusMsg.classList.add('show');
  errorMsg.classList.remove('show');
}

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.add('show');
  statusMsg.classList.remove('show');
}

// ============================================================
// 🚀 पेज खुलते ही DEFAULT लिंक लोड करें
// ============================================================
window.addEventListener('load', function() {
  if (DEFAULT_VIDEO_URL && DEFAULT_VIDEO_URL !== "https://example.com/stream.m3u8") {
    loadVideo(DEFAULT_VIDEO_URL);
  } else {
    showError('❌ कृपया script.js में DEFAULT_VIDEO_URL में .m3u8 लिंक डालें।');
  }
});

// ============================================================
// 🔄 वीडियो रुकने पर ऑटो-रिकवरी (हर 3 सेकंड में चेक)
// ============================================================
setInterval(function() {
  if (!video) return;

  // अगर वीडियो रुका हुआ है और रिकवर हो रहा है
  if (video.paused && video.currentTime > 0 && !video.ended && video.readyState < 2 && !isRecovering) {
    console.log('🔄 वीडियो रुका हुआ है, रिकवर कर रहे हैं...');
    showStatus('🔄 वीडियो पुनः लोड किया जा रहा है...');
    const currentSrc = DEFAULT_VIDEO_URL;
    if (currentSrc && currentSrc !== "https://example.com/stream.m3u8") {
      loadVideo(currentSrc);
    }
  }

  // अगर वीडियो का बफर खाली है
  if (video.buffered.length > 0) {
    const bufferedEnd = video.buffered.end(video.buffered.length - 1);
    const currentTime = video.currentTime;
    // अगर बफर 3 सेकंड से कम है तो रिकवर करें
    if (bufferedEnd - currentTime < 3 && !video.paused && !isRecovering) {
      console.log('🔄 बफर कम है, रिफ्रेश कर रहे हैं...');
      showStatus('🔄 बफर रिफ्रेश किया जा रहा है...');
      const currentSrc = DEFAULT_VIDEO_URL;
      if (currentSrc && currentSrc !== "https://example.com/stream.m3u8") {
        loadVideo(currentSrc);
      }
    }
  }
}, 3000);

console.log('✅ लाइव स्ट्रीम वेबसाइट तैयार है!');
console.log('📺 लिंक:', DEFAULT_VIDEO_URL);
console.log('🔀 CORS Proxy:', CORS_PROXY);
