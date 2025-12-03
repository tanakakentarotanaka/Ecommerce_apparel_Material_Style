/**
 * Fashion BI Hero Video Menu (Position & Color Control)
 * Customizable layout positioning and separate color controls.
 */

looker.plugins.visualizations.add({
  // 設定オプション
  options: {
    // --- ブランドロゴ設定 ---
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
    // --- 位置調整 (新規) ---
    padding_left: {
      type: "number",
      label: "Left Padding (px)",
      default: 60,
      display: "number",
      section: "Position"
    },
    padding_top: {
      type: "number",
      label: "Top Offset (px)",
      default: 0,
      display: "number",
      section: "Position",
      placeholder: "Positive moves down, Negative moves up"
    },
    gap_size: {
      type: "number",
      label: "Gap between Logo & Menu (px)",
      default: 32,
      display: "number",
      section: "Position"
    },
    // --- 配色設定 ---
    text_color: {
      type: "string",
      label: "Brand Main Color",
      default: "#333333", // 白背景に合わせて濃い色に変更
      display: "color",
      section: "Color"
    },
    accent_color: {
      type: "string",
      label: "Accent Color",
      default: "#AA7777",
      display: "color",
      section: "Color"
    },
    menu_text_color: { // 新規: メニュー専用の色設定
      type: "string",
      label: "Menu Text Color",
      default: "#333333", // デフォルトを濃い色に
      display: "color",
      section: "Color"
    },
    // --- 背景設定 ---
    overlay_color: {
      type: "string",
      label: "Overlay Color",
      default: "#FFFFFF", // 白フィルター前提
      display: "color",
      section: "Background"
    },
    overlay_opacity: {
      type: "number",
      label: "Overlay Opacity (0-1)",
      default: 0.7, // 白が強めにかかるように調整
      display: "range",
      min: 0,
      max: 1,
      step: 0.05,
      section: "Background"
    },
    video_url: {
      type: "string",
      label: "Video URL (MP4)",
      default: "https://videos.pexels.com/video-files/3205934/3205934-hd_1920_1080_25fps.mp4",
      display: "text",
      section: "Background"
    },
    // --- メニュー内容設定 ---
    active_tab: {
      type: "string",
      label: "Active Tab Name",
      default: "Products",
      display: "text",
      section: "Menu Config"
    },
    menu_label_1: { type: "string", label: "Menu 1 Label", default: "Dashboard", section: "Menu Config", order: 1 },
    menu_link_1: { type: "string", label: "Menu 1 Link", default: "/dashboards/1", section: "Menu Config", order: 2 },
    menu_label_2: { type: "string", label: "Menu 2 Label", default: "Products", section: "Menu Config", order: 3 },
    menu_link_2: { type: "string", label: "Menu 2 Link", default: "/dashboards/2", section: "Menu Config", order: 4 },
    menu_label_3: { type: "string", label: "Menu 3 Label", default: "Campaigns", section: "Menu Config", order: 5 },
    menu_link_3: { type: "string", label: "Menu 3 Link", default: "/dashboards/3", section: "Menu Config", order: 6 },
    menu_label_4: { type: "string", label: "Menu 4 Label", default: "Settings", section: "Menu Config", order: 7 },
    menu_link_4: { type: "string", label: "Menu 4 Link", default: "/dashboards/settings", section: "Menu Config", order: 8 }
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
          background-color: #f0f0f0;
        }

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

        .overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
        }

        /* メニューコンテンツ (動的パディング対応) */
        .menu-content {
          position: relative;
          z-index: 2;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: flex-start; /* 左寄せ */
          justify-content: center; /* 垂直中央 */
          box-sizing: border-box;
          /* パディングとギャップはJSで制御 */
        }

        .brand-logo {
          font-family: 'Playfair Display', serif;
          font-size: 48px;
          font-weight: 400;
          letter-spacing: 2px;
          line-height: 1.1;
        }

        .nav-links {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;
          border-left: 1px solid rgba(0,0,0,0.1); /* ガイドライン（色はJSで微調整可） */
          padding-left: 24px;
          transition: border-color 0.3s;
        }

        .nav-item {
          font-size: 14px;
          font-weight: 400;
          letter-spacing: 2px;
          text-transform: uppercase;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          padding: 4px 0;
          display: flex;
          align-items: center;
        }

        .nav-item:hover {
          transform: translateX(5px);
        }

        .nav-item.active {
          font-weight: 600;
          cursor: default;
          transform: translateX(5px);
        }

        /* アクティブ時の左アクセントライン */
        .nav-item.active::before {
          content: '';
          position: absolute;
          left: -27px; /* ガイドラインの位置 */
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 100%;
          /* 色はJSで指定 */
        }

      </style>
      <div id="viz-root" class="hero-container">
        <div class="video-wrapper" id="video-wrapper"></div>
        <div class="overlay" id="color-overlay"></div>
        <div class="menu-content" id="menu-content">
          <div class="brand-logo" id="brand-logo"></div>
          <div class="nav-links" id="nav-links"></div>
        </div>
      </div>
    `;
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    const videoWrapper = element.querySelector("#video-wrapper");
    const colorOverlay = element.querySelector("#color-overlay");
    const menuContent = element.querySelector("#menu-content");
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

    // 2. デザイン・色・位置設定の反映
    colorOverlay.style.backgroundColor = config.overlay_color;
    colorOverlay.style.opacity = config.overlay_opacity;

    // 位置調整 (Padding & Gap)
    menuContent.style.paddingLeft = `${config.padding_left}px`;
    menuContent.style.paddingTop = `${config.padding_top}px`; // 垂直位置のズレ
    menuContent.style.gap = `${config.gap_size}px`;

    // 色設定
    const brandColor = config.text_color || "#333333";
    const accentColor = config.accent_color || "#AA7777";
    const menuColor = config.menu_text_color || "#333333";

    // ブランドロゴ描画
    const mainText = config.brand_text_main || "FASHION";
    const accentText = config.brand_text_accent || "NOVA";

    brandLogo.style.color = brandColor;
    brandLogo.innerHTML = `${mainText} <span style="color: ${accentColor}; font-weight: 700;">${accentText}</span>`;

    // 3. メニュー生成
    const activeTab = config.active_tab || "Products";
    const menuItems = [];
    for (let i = 1; i <= 4; i++) {
      const label = config[`menu_label_${i}`];
      const link = config[`menu_link_${i}`];
      if (label && link) menuItems.push({ name: label, link: link });
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

    // ガイドラインの色をメニュー色に合わせる（薄く）
    // RGB変換して透明度を設定するのは複雑なので、シンプルに currentColor (menuColor) を使うか、border-colorで指定
    // ここでは単純にborder-colorを変更
    navLinksContainer.style.borderLeftColor = menuColor;
    navLinksContainer.style.opacity = 1; // コンテナ自体の不透明度リセット

    // CSS変数や直接スタイルでアクセントカラーを注入（active::before用）
    const styleTag = document.createElement("style");
    styleTag.innerHTML = `
      .nav-item.active::before { background-color: ${accentColor} !important; }
      .nav-links { border-left-color: ${menuColor}40 !important; } /* 40は透明度(Hex) */
    `;
    element.appendChild(styleTag);

    menuItems.forEach(item => {
      const isActive = (item.name === activeTab);

      const el = document.createElement(isActive ? "div" : "a");
      el.className = isActive ? "nav-item active" : "nav-item";
      if (!isActive) el.href = item.link;
      el.innerText = item.name;

      // 文字色の適用
      if (isActive) {
        el.style.color = menuColor; // アクティブ時も基本メニュー色（太字で強調）
        // もしアクティブだけアクセントカラーにしたい場合は el.style.color = accentColor;
      } else {
        el.style.color = menuColor;
        el.style.opacity = "0.7"; // 非アクティブ時は少し薄く
      }

      navLinksContainer.appendChild(el);
    });

    done();
  }
});
