// ============================================================
// 🔴 अपना REAL .m3u8 लिंक यहाँ डालें
// ============================================================
const DEFAULT_VIDEO_URL = "https://vs.classplusapp.com/hls/6a7089aae86acfbc9dbb33f5/index.m3u8";

let livePlayer = null;
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
// 🚀 LivePlayer से वीडियो चलाएँ
// ============================================================
function initLivePlayer(url) {
  if (!url) {
    errorMsg.textContent = "❌ URL खाली है!";
    errorMsg.classList.add('show');
    return;
  }

  errorMsg.classList.remove('show');

  const playerElement = document.getElementById('player-container');

  // अगर पहले से प्लेयर है तो उसे रीसेट करें
  if (livePlayer) {
    try {
      livePlayer.destroy();
    } catch (e) {
      console.warn('पुराना प्लेयर डिस्ट्रॉय करते समय एरर:', e);
    }
    livePlayer = null;
    // कंटेनर खाली करें
    playerElement.innerHTML = '';
  }

  try {
    // LivePlayer को इनिशियलाइज़ करें
    livePlayer = new LivePlayer(playerElement, {
      streamUrls: {
        'HD': url
      },
      // ऑटोप्ले
      autoplay: true,
      // कंट्रोल्स
      controls: true,
      // थंबनेल (ऑफ)
      thumbnails: false,
      // लोडिंग इंडिकेटर
      loader: true,
      // एरर होने पर रीट्राई
      retry: {
        count: 50,
        delay: 3000
      }
    });

    console.log('✅ LivePlayer शुरू हो गया!');
    console.log('📺 लिंक:', url);

    // प्लेयर तैयार होने पर
    livePlayer.on('ready', function() {
      console.log('✅ प्लेयर तैयार है');
      errorMsg.classList.remove('show');
    });

    // प्लेयर एरर होने पर
    livePlayer.on('error', function(error) {
      console.error('❌ प्लेयर एरर:', error);
      errorMsg.textContent = '❌ वीडियो लोड नहीं हुआ। लिंक एक्सपायर हो सकता है।';
      errorMsg.classList.add('show');
    });

    // प्ले शुरू होने पर
    livePlayer.on('play', function() {
      console.log('▶️ वीडियो चल रहा है');
      errorMsg.classList.remove('show');
    });

    // रुकने पर
    livePlayer.on('pause', function() {
      console.log('⏸️ वीडियो रुका हुआ है');
    });

    // वीडियो खत्म होने पर
    livePlayer.on('ended', function() {
      console.log('⏹️ वीडियो खत्म हो गया');
    });

    // बफरिंग शुरू होने पर
    livePlayer.on('waiting', function() {
      console.log('⏳ बफर हो रहा है...');
    });

  } catch (error) {
    console.error('❌ LivePlayer इनिशियलाइज़ करते समय एरर:', error);
    errorMsg.textContent = '❌ प्लेयर शुरू नहीं हो पाया: ' + error.message;
    errorMsg.classList.add('show');
  }
}

// ============================================================
// 🚀 पेज लोड होने पर प्लेयर शुरू करें
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
  if (DEFAULT_VIDEO_URL && DEFAULT_VIDEO_URL !== "https://example.com/stream.m3u8") {
    // थोड़ा इंतज़ार करें ताकि DOM पूरी तरह तैयार हो जाए
    setTimeout(function() {
      initLivePlayer(DEFAULT_VIDEO_URL);
    }, 500);
  } else {
    errorMsg.textContent = "❌ कृपया script.js में DEFAULT_VIDEO_URL में .m3u8 लिंक डालें।";
    errorMsg.classList.add('show');
  }
});

console.log('✅ लाइव स्ट्रीम वेबसाइट तैयार है! (LivePlayer के साथ)');
console.log('📺 लिंक:', DEFAULT_VIDEO_URL);
