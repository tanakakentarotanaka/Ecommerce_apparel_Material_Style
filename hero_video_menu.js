/**
 * Fashion BI Hero Video Menu (Tall Version)
 * Background Video (MP4) with Luxury Glassmorphism Buttons
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
      section: "Video"
    },
    hero_height: {
      type: "number",
      label: "Hero Height (px)",
      default: 180, // 動画を目立たせるため高さを確保
      display: "number",
      section: "Video"
    },
    // --- デザイン設定 ---
    overlay_color: {
      type: "string",
      label: "Overlay Color",
      default: "#000000", // 動画を少し暗くして文字を白くするパターン推奨
      display: "color",
      section: "Style"
    },
    overlay_opacity: {
      type: "number",
      label: "Overlay Opacity (0-1)",
      default: 0.3, // 動画の美しさを活かすため薄めに
      display: "range",
      min: 0,
      max: 1,
      step: 0.05,
      section: "Style"
    },
    text_color: {
      type: "string",
      label: "Text Color",
      default: "#FFFFFF", // 白文字推奨
      display: "color",
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
          background-color: #222; /* 読み込み前の背景 */
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
        }

        /* メニューコンテンツ */
        .menu-content {
          position: relative;
          z-index: 2;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px; /* 左右の余白を多めに */
          box-sizing: border-box;
        }

        .brand-logo {
          font-family: 'Playfair Display', serif;
          font-size: 32px; /* 高さに負けないよう大きく */
          font-weight: 400;
          color: #fff;
          letter-spacing: 2px;
          white-space: nowrap;
          text-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 16px; /* ボタン同士の間隔 */
        }

        /* --- ラグジュアリー・グラスボタン --- */
        .nav-item {
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase; /* 高級感を出すため大文字 */
          text-decoration: none;

          padding: 12px 24px;
          border-radius: 30px; /* 完全なピル型 */

          /* ガラスの質感 */
          background: rgba(255, 255, 255, 0.1); /* 薄い白 */
          backdrop-filter: blur(8px); /* 背景をぼかす */
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.2); /* 薄い枠線 */

          color: #fff;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        }

        /* ホバー時: 明るくなる */
        .nav-item:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: translateY(-2px);
          box-shadow: 0 8px 15px rgba(0,0,0,0.1);
          border-color: rgba(255, 255, 255, 0.4);
        }

        /* アクティブ時: ブランドカラーで塗りつぶし */
        .nav-item.active {
          background: #AA7777; /* Rose Quartz Dark */
          border-color: #AA7777;
          color: #fff;
          box-shadow: 0 4px 12px rgba(170, 119, 119, 0.4); /* 色付きの影 */
          cursor: default;
        }

        /* アクティブ時はホバーしても動かさない */
        .nav-item.active:hover {
          transform: none;
          background: #AA7777;
        }

      </style>
      <div id="viz-root" class="hero-container">
        <div class="video-wrapper" id="video-wrapper"></div>
        <div class="overlay" id="color-overlay"></div>
        <div class="menu-content">
          <div class="brand-logo" id="brand-logo">
            FASHION <span style="font-weight: 700;">NOVA</span>
          </div>
          <div class="nav-links" id="nav-links"></div>
        </div>
      </div>
    `;
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    const container = element.querySelector("#viz-root");
    const videoWrapper = element.querySelector("#video-wrapper");
    const colorOverlay = element.querySelector("#color-overlay");
    const navLinksContainer = element.querySelector("#nav-links");
    const brandLogo = element.querySelector("#brand-logo");

    this.clearErrors();

    // 0. コンテナの高さ設定 (オプション反映)
    const height = config.hero_height || 180;
    // Lookerのiframe内での高さを確保するため、最小高さを設定
    // ※注意: Lookerのダッシュボード編集画面でタイルの高さ自体も広げる必要があります
    container.style.minHeight = `${height}px`;

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

    // 2. デザイン設定の反映
    colorOverlay.style.backgroundColor = config.overlay_color;
    colorOverlay.style.opacity = config.overlay_opacity;

    // ロゴとボタンの文字色
    const textColor = config.text_color || "#FFFFFF";
    brandLogo.style.color = textColor;
    // spanタグ(NOVA部分)の色はアクセントカラー(#AA7777)固定か、白に合わせるか
    // ここでは高級感を出すため、NOVA部分は常にアクセントカラーにします
    brandLogo.innerHTML = `FASHION <span style="color: #AA7777; font-weight: 700;">NOVA</span>`;


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

      const el = document.createElement(isActive ? "div" : "a");
      el.className = isActive ? "nav-item active" : "nav-item";
      if (!isActive) el.href = item.link;
      el.innerText = item.name;

      // 非アクティブ時の文字色は設定に従う
      if (!isActive) {
        el.style.color = textColor;
      }

      navLinksContainer.appendChild(el);
    });

    done();
  }
});
