/**
 * Fashion BI Hero Video Menu (Square / Vertical Layout)
 * Background Video (MP4) with Customizable Vertical Navigation
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
    // --- デザイン設定 ---
    overlay_color: {
      type: "string",
      label: "Overlay Color",
      default: "#000000",
      display: "color",
      section: "Style"
    },
    overlay_opacity: {
      type: "number",
      label: "Overlay Opacity (0-1)",
      default: 0.4,
      display: "range",
      min: 0,
      max: 1,
      step: 0.05,
      section: "Style"
    },
    text_color: {
      type: "string",
      label: "Text Color",
      default: "#FFFFFF",
      display: "color",
      section: "Style"
    },
    // --- メニュー内容設定 (自由に変更可能) ---
    active_tab: {
      type: "string",
      label: "Active Tab Name",
      default: "Products",
      display: "text",
      section: "Menu Config"
    },
    menu_label_1: {
      type: "string",
      label: "Menu 1 Label",
      default: "Dashboard",
      section: "Menu Config",
      order: 1
    },
    menu_link_1: {
      type: "string",
      label: "Menu 1 Link",
      default: "/dashboards/1",
      section: "Menu Config",
      order: 2
    },
    menu_label_2: {
      type: "string",
      label: "Menu 2 Label",
      default: "Products",
      section: "Menu Config",
      order: 3
    },
    menu_link_2: {
      type: "string",
      label: "Menu 2 Link",
      default: "/dashboards/2",
      section: "Menu Config",
      order: 4
    },
    menu_label_3: {
      type: "string",
      label: "Menu 3 Label",
      default: "Campaigns",
      section: "Menu Config",
      order: 5
    },
    menu_link_3: {
      type: "string",
      label: "Menu 3 Link",
      default: "/dashboards/3",
      section: "Menu Config",
      order: 6
    },
    menu_label_4: {
      type: "string",
      label: "Menu 4 Label",
      default: "Settings",
      section: "Menu Config",
      order: 7
    },
    menu_link_4: {
      type: "string",
      label: "Menu 4 Link",
      default: "/dashboards/settings",
      section: "Menu Config",
      order: 8
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
          background-color: #222;
          display: flex;
          align-items: center;
          justify-content: center;
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

        /* メニューコンテンツ (縦積みレイアウト) */
        .menu-content {
          position: relative;
          z-index: 2;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column; /* 縦並び */
          align-items: center;    /* 中央揃え */
          justify-content: center;
          padding: 40px;
          box-sizing: border-box;
          gap: 40px; /* ロゴとメニューの間隔 */
        }

        .brand-logo {
          font-family: 'Playfair Display', serif;
          font-size: 36px;
          font-weight: 400;
          color: #fff;
          letter-spacing: 2px;
          white-space: nowrap;
          text-shadow: 0 4px 12px rgba(0,0,0,0.3);
          text-align: center;
        }

        .nav-links {
          display: flex;
          flex-direction: column; /* ボタンも縦並び */
          align-items: center;
          gap: 16px;
          width: 100%;
          max-width: 280px; /* ボタンの最大幅 */
        }

        /* --- ラグジュアリー・グラスボタン (縦型用調整) --- */
        .nav-item {
          width: 100%; /* 親要素の幅いっぱいに */
          text-align: center;
          justify-content: center;

          font-size: 14px;
          font-weight: 600;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          text-decoration: none;

          padding: 14px 0; /* 上下のパディング */
          border-radius: 8px; /* 少し角丸を抑えてボックスらしく */

          /* ガラスの質感 */
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.2);

          color: #fff;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
          display: flex;
        }

        .nav-item:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: translateY(-2px);
          box-shadow: 0 8px 15px rgba(0,0,0,0.1);
          border-color: rgba(255, 255, 255, 0.4);
        }

        /* アクティブ時 */
        .nav-item.active {
          background: rgba(170, 119, 119, 0.75);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.5);
          color: #fff;
          box-shadow: 0 8px 24px rgba(170, 119, 119, 0.5);
          cursor: default;
          text-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }

        .nav-item.active:hover {
          transform: none;
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
    const videoWrapper = element.querySelector("#video-wrapper");
    const colorOverlay = element.querySelector("#color-overlay");
    const navLinksContainer = element.querySelector("#nav-links");
    const brandLogo = element.querySelector("#brand-logo");

    this.clearErrors();

    // 1. 動画設定
    const videoUrl = config.video_url || "https://videos.pexels.com/video-files/3205934/3205934-hd_1920_1080_25fps.mp4";
    const currentVideo = videoWrapper.querySelector("video");
    if (!currentVideo || currentVideo.src !== videoUrl) {
      videoWrapper.innerHTML = `
        <video class="bg-video" autoplay muted loop playsinline>
          <source src="${videoUrl}" type="video/mp4">
        </video>
      `;
    }

    // 2. デザイン反映
    colorOverlay.style.backgroundColor = config.overlay_color;
    colorOverlay.style.opacity = config.overlay_opacity;

    const textColor = config.text_color || "#FFFFFF";
    brandLogo.style.color = textColor;
    brandLogo.innerHTML = `FASHION <span style="color: #AA7777; font-weight: 700;">NOVA</span>`;

    // 3. メニュー生成 (オプションから取得)
    const activeTab = config.active_tab || "Products";

    // 4つのメニュー枠を配列化して処理
    const menuItems = [];
    for (let i = 1; i <= 4; i++) {
      const label = config[`menu_label_${i}`];
      const link = config[`menu_link_${i}`];
      if (label && link) { // ラベルとリンクが設定されている場合のみ表示
        menuItems.push({ name: label, link: link });
      }
    }

    // もし設定が空ならデフォルトを表示
    if (menuItems.length === 0) {
      menuItems.push(
        { name: "Dashboard", link: "#" },
        { name: "Products", link: "#" },
        { name: "Campaigns", link: "#" },
        { name: "Settings", link: "#" }
      );
    }

    navLinksContainer.innerHTML = "";
    menuItems.forEach(item => {
      const isActive = (item.name === activeTab);

      const el = document.createElement(isActive ? "div" : "a");
      el.className = isActive ? "nav-item active" : "nav-item";
      if (!isActive) el.href = item.link;
      el.innerText = item.name;

      if (!isActive) {
        el.style.color = textColor;
      }

      navLinksContainer.appendChild(el);
    });

    done();
  }
});
