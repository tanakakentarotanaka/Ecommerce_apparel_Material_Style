/**
 * Fashion BI Hero Video Menu (Editorial Layout)
 * Left-aligned, Typography-focused navigation for a high-brand look.
 */

looker.plugins.visualizations.add({
  // 設定オプション
  options: {
    // --- ブランドロゴ設定 (新規) ---
    brand_text_main: {
      type: "string",
      label: "Brand Text (Main)",
      default: "FASHION",
      display: "text",
      section: "Brand"
    },
    brand_text_accent: {
      type: "string",
      label: "Brand Text (Accent)",
      default: "NOVA",
      display: "text",
      section: "Brand"
    },
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
    accent_color: {
      type: "string",
      label: "Accent Color",
      default: "#AA7777", // アクティブ時のライン色
      display: "color",
      section: "Style"
    },
    // --- メニュー内容設定 ---
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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&family=Playfair+Display:wght@400;700&display=swap');

        .hero-container {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
          background-color: #222;
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

        /* メニューコンテンツ (左寄せレイアウト) */
        .menu-content {
          position: relative;
          z-index: 2;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: flex-start; /* 左寄せ */
          justify-content: center;
          padding-left: 60px; /* 左側の余白 */
          box-sizing: border-box;
          gap: 32px;
        }

        /* ブランドロゴ */
        .brand-logo {
          font-family: 'Playfair Display', serif;
          font-size: 48px; /* 大きく印象的に */
          font-weight: 400;
          color: #fff;
          letter-spacing: 2px;
          line-height: 1.1;
          margin-bottom: 10px;
          text-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }

        .nav-links {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;
          border-left: 1px solid rgba(255,255,255,0.2); /* 左側に薄いガイドライン */
          padding-left: 24px;
        }

        /* --- エディトリアル風メニューアイテム --- */
        .nav-item {
          font-size: 14px;
          font-weight: 400; /* 細身で上品に */
          letter-spacing: 2px;
          text-transform: uppercase;
          text-decoration: none;
          color: rgba(255, 255, 255, 0.7); /* 非アクティブは少し薄く */
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          padding: 4px 0;
          display: flex;
          align-items: center;
        }

        /* ホバー時 */
        .nav-item:hover {
          color: #fff;
          transform: translateX(5px); /* 右へ少しスライド */
        }

        /* アクティブ時 */
        .nav-item.active {
          color: #fff;
          font-weight: 600;
          cursor: default;
          transform: translateX(5px);
        }

        /* アクティブ時の左アクセントライン */
        .nav-item.active::before {
          content: '';
          position: absolute;
          left: -27px; /* ガイドラインの位置に合わせる */
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 100%;
          background-color: #AA7777; /* アクセントカラー */
        }

      </style>
      <div id="viz-root" class="hero-container">
        <div class="video-wrapper" id="video-wrapper"></div>
        <div class="overlay" id="color-overlay"></div>
        <div class="menu-content">
          <div class="brand-logo" id="brand-logo">
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

    // ブランドテキストの更新
    const mainText = config.brand_text_main || "FASHION";
    const accentText = config.brand_text_accent || "NOVA";
    const textColor = config.text_color || "#FFFFFF";
    const accentColor = config.accent_color || "#AA7777";

    brandLogo.style.color = textColor;
    brandLogo.innerHTML = `${mainText} <span style="color: ${accentColor}; font-weight: 700;">${accentText}</span>`;

    // 3. メニュー生成
    const activeTab = config.active_tab || "Products";

    const menuItems = [];
    for (let i = 1; i <= 4; i++) {
      const label = config[`menu_label_${i}`];
      const link = config[`menu_link_${i}`];
      if (label && link) {
        menuItems.push({ name: label, link: link });
      }
    }
    if (menuItems.length === 0) {
      menuItems.push(
        { name: "Dashboard", link: "#" },
        { name: "Products", link: "#" },
        { name: "Campaigns", link: "#" },
        { name: "Settings", link: "#" }
      );
    }

    navLinksContainer.innerHTML = "";

    // CSS変数でアクセントカラーを渡す（疑似要素の色用）
    navLinksContainer.style.setProperty('--accent-color', accentColor);

    menuItems.forEach(item => {
      const isActive = (item.name === activeTab);

      const el = document.createElement(isActive ? "div" : "a");
      el.className = isActive ? "nav-item active" : "nav-item";
      if (!isActive) el.href = item.link;
      el.innerText = item.name;

      // アクティブ時のスタイル (JavaScriptでの動的制御)
      if (isActive) {
        // before疑似要素の色はstyleタグ内で制御しているので、ここでは何もしなくて良いが、
        // もしJSで直接制御したい場合はstyle要素を動的に書き換える必要がある。
        // 今回はシンプルに、styleタグ内のCSSでクラス制御しているため、
        // アクティブな要素に直接スタイルを当てる。
        const styleTag = document.createElement("style");
        styleTag.innerHTML = `.nav-item.active::before { background-color: ${accentColor} !important; }`;
        element.appendChild(styleTag);
      } else {
        el.style.color = textColor;
        el.style.opacity = "0.7"; // 非アクティブ時の透明度
      }

      navLinksContainer.appendChild(el);
    });

    done();
  }
});
