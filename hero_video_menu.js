/**
 * Fashion BI Hero Video Menu (Luxury Hover Edition)
 * Background Video (MP4) with Elegant Navigation Animation
 */

looker.plugins.visualizations.add({
  // 設定オプション
  options: {
    // --- 動画設定 ---
    video_url: {
      type: "string",
      label: "Video URL (MP4)",
      default: "https://videos.pexels.com/video-files/3205934/3205934-hd_1920_1080_25fps.mp4",
      display: "text",
      placeholder: "https://example.com/video.mp4",
      section: "Video"
    },
    // --- デザイン設定 ---
    overlay_color: {
      type: "string",
      label: "Overlay Color",
      default: "#ffffff",
      display: "color",
      section: "Style"
    },
    overlay_opacity: {
      type: "number",
      label: "Overlay Opacity (0-1)",
      default: 0.85,
      display: "range",
      min: 0,
      max: 1,
      step: 0.05,
      section: "Style"
    },
    active_tab: {
      type: "string",
      label: "Active Tab Name",
      default: "Products",
      display: "text",
      section: "Menu"
    }
  },

  create: function(element, config) {
    element.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@400;700&display=swap');

        .hero-container {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
          background-color: #f0f0f0;
        }

        /* 背景動画エリア */
        .video-wrapper {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .bg-video {
          position: absolute;
          top: 50%;
          left: 50%;
          min-width: 100%;
          min-height: 100%;
          width: auto;
          height: auto;
          transform: translate(-50%, -50%);
          object-fit: cover;
        }

        /* オーバーレイ */
        .overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
          transition: background-color 0.5s ease;
        }

        /* メニューコンテンツ */
        .menu-content {
          position: relative;
          z-index: 2;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          box-sizing: border-box;
          border-bottom: 1px solid rgba(0,0,0,0.05);
        }

        .brand-logo {
          font-family: 'Playfair Display', serif;
          font-size: 24px;
          font-weight: 400;
          color: #333;
          letter-spacing: 1px;
          white-space: nowrap;
        }

        .nav-links {
          display: flex;
          align-items: center;
          height: 100%;
        }

        /* ナビゲーションアイテム（共通） */
        .nav-item {
          font-size: 14px;
          font-weight: 500;
          color: #888; /* 通常時は少し淡く */
          padding: 0 4px;
          margin-left: 60px; /* 広めの間隔 */
          height: 100%;
          display: flex;
          align-items: center;
          cursor: pointer;
          position: relative;
          text-decoration: none;
          letter-spacing: 0.5px;
          /* 滑らかな変化のためのトランジション */
          transition: color 0.4s cubic-bezier(0.25, 1, 0.5, 1), text-shadow 0.4s ease;
        }

        /* 高級ホバーエフェクト: 下線のアニメーション */
        .nav-item::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%; /* 中央から */
          width: 0; /* 最初は幅ゼロ */
          height: 2px; /* 細めのライン */
          background-color: #AA7777;
          opacity: 0;
          transform: translateX(-50%);
          transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1); /* 加減速をつける */
        }

        /* ホバー時の挙動 */
        .nav-item:hover {
          color: #555; /* 少し濃く */
          text-shadow: 0 0 15px rgba(170, 119, 119, 0.3); /* ふんわりとした輝き */
        }

        .nav-item:hover::after {
          width: 100%; /* 全幅に広がる */
          opacity: 1;
        }

        /* アクティブ状態（選択中） */
        .nav-item.active {
          font-weight: 700;
          color: #AA7777;
          cursor: default;
          text-shadow: none;
        }

        /* アクティブ時の下線（常時表示、少し太く） */
        .nav-item.active::after {
          width: 100%;
          height: 3px;
          opacity: 1;
          background-color: #AA7777;
        }
      </style>
      <div id="viz-root" class="hero-container">
        <div class="video-wrapper" id="video-wrapper">
          </div>
        <div class="overlay" id="color-overlay"></div>
        <div class="menu-content">
          <div class="brand-logo">
            FASHION <span style="color: #AA7777; font-weight: 700;">NOVA</span>
          </div>
          <div class="nav-links" id="nav-links"></div>
        </div>
      </div>
    `;
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    const videoWrapper = element.querySelector("#video-wrapper");
    const colorOverlay = element.querySelector("#color-overlay");
    const navLinksContainer = element.querySelector("#nav-links");

    this.clearErrors();

    // 1. 動画の設定
    const videoUrl = config.video_url || "https://videos.pexels.com/video-files/3205934/3205934-hd_1920_1080_25fps.mp4";

    const currentVideo = videoWrapper.querySelector("video");
    if (!currentVideo || currentVideo.src !== videoUrl) {
      videoWrapper.innerHTML = `
        <video class="bg-video" autoplay muted loop playsinline>
          <source src="${videoUrl}" type="video/mp4">
        </video>
      `;
    }

    // 2. オーバーレイ調整
    colorOverlay.style.backgroundColor = config.overlay_color;
    colorOverlay.style.opacity = config.overlay_opacity;

    // 3. メニュー生成
    const activeTab = config.active_tab || "Products";
    const menuItems = [
      { name: "Dashboard", link: "/dashboards/1" },
      { name: "Products", link: "/dashboards/2" },
      { name: "Campaigns", link: "/dashboards/3" },
      { name: "Settings", link: "/dashboards/settings" }
    ];

    navLinksContainer.innerHTML = "";
    menuItems.forEach(item => {
      const isActive = (item.name === activeTab);

      if (isActive) {
        const div = document.createElement("div");
        div.className = "nav-item active";
        div.innerText = item.name;
        navLinksContainer.appendChild(div);
      } else {
        const a = document.createElement("a");
        a.className = "nav-item";
        a.href = item.link;
        a.innerText = item.name;
        navLinksContainer.appendChild(a);
      }
    });

    done();
  }
});
