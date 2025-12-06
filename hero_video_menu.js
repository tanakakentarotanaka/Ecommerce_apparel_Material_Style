/**
 * Fashion BI Hero - "Editorial Cover" Layout
 * Layout:
 * [ Top Navigation Bar (Menu) ]
 * [ Center Hero (Brand Title) ]
 * [ Bottom Ticker (KPI Data)  ]
 */

looker.plugins.visualizations.add({
  // --- 設定オプション (Configuration) [cite: 381] ---
  options: {
    // 1. BRANDING
    brand_text: { type: "string", label: "Brand Title", default: "Women's Fashion", section: "1. Brand", order: 1 },
    brand_font_size: { type: "number", label: "Title Size (px)", default: 72, section: "1. Brand", order: 2 },

    // 2. MENU CONFIG
    active_tab: { type: "string", label: "Active Tab Name", default: "Dashboard", section: "2. Menu" },
    menu_items: { type: "string", label: "Menu Items (comma separated)", default: "Dashboard, Products, Metallic Accents, Settings", section: "2. Menu" },

    // 3. KPI CONFIG (Data Mapping)
    kpi_unit_1: { type: "string", label: "KPI 1 Unit", placeholder: "$", section: "3. KPIs", order: 1 },
    kpi_unit_2: { type: "string", label: "KPI 2 Unit", placeholder: "Avg", section: "3. KPIs", order: 2 },
    kpi_unit_3: { type: "string", label: "KPI 3 Unit", placeholder: "Qty", section: "3. KPIs", order: 3 },

    // 4. STYLING (Colors & Video)
    text_color: { type: "string", label: "Main Text Color", default: "#333333", display: "color", section: "4. Style" },
    accent_color: { type: "string", label: "Accent Color", default: "#AA7777", display: "color", section: "4. Style" },
    bg_color: { type: "string", label: "Background/Overlay Color", default: "#FAF9F8", display: "color", section: "4. Style" },
    video_url: { type: "string", label: "Video URL", default: "https://videos.pexels.com/video-files/3205934/3205934-hd_1920_1080_25fps.mp4", section: "4. Style" },
    video_opacity: { type: "number", label: "Video Opacity (0-1)", default: 0.15, display: "range", min: 0, max: 1, step: 0.05, section: "4. Style" },
  },

  // --- 初期化 (Create) [cite: 198, 246] ---
  create: function(element, config) {
    element.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');

        /* コンテナ全体 */
        .viz-container {
          font-family: 'Inter', sans-serif;
          width: 100%; height: 100%;
          position: relative; overflow: hidden;
          display: flex; flex-direction: column; justify-content: space-between;
          background-color: #FAF9F8; /* デフォルト背景 */
        }

        /* 背景動画レイヤー */
        .video-layer {
          position: absolute; top: 0; left: 0; width: 100%; height: 100%;
          z-index: 0; pointer-events: none; mix-blend-mode: multiply;
        }
        .bg-video {
          width: 100%; height: 100%; object-fit: cover;
        }

        /* --- 1. Top Navigation --- */
        .top-nav {
          position: relative; z-index: 2;
          width: 100%; padding: 24px 40px;
          display: flex; justify-content: flex-start; gap: 40px;
          box-sizing: border-box;
        }
        .nav-item {
          text-decoration: none; font-size: 14px; letter-spacing: 0.05em;
          color: inherit; opacity: 0.6; transition: all 0.3s ease;
          position: relative; cursor: pointer;
        }
        .nav-item:hover { opacity: 1; }
        .nav-item.active { opacity: 1; font-weight: 500; }
        /* アクティブなタブの下線 */
        .nav-item.active::after {
          content: ''; position: absolute; bottom: -8px; left: 0;
          width: 100%; height: 2px; background-color: currentColor;
        }

        /* --- 2. Center Hero --- */
        .hero-center {
          position: relative; z-index: 2;
          flex-grow: 1; display: flex; align-items: center; justify-content: center;
          text-align: center;
        }
        .brand-title {
          font-family: 'Playfair Display', serif;
          font-weight: 400; line-height: 1.1; letter-spacing: -0.02em;
        }
        .brand-subtitle {
           font-family: 'Inter', sans-serif; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase;
           margin-top: 16px; opacity: 0.6;
        }

        /* --- 3. Bottom KPI Bar --- */
        .bottom-bar {
          position: relative; z-index: 2;
          width: 100%; padding: 20px 40px;
          display: flex; justify-content: space-between; align-items: flex-end;
          box-sizing: border-box;
          backdrop-filter: blur(5px); /* すりガラス効果 */
          border-top: 1px solid rgba(0,0,0,0.05);
        }

        .kpi-group {
          display: flex; gap: 60px; /* KPI同士の間隔 */
        }
        .kpi-item {
          display: flex; flex-direction: column; align-items: flex-start;
        }
        .kpi-label {
          font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.7;
          margin-bottom: 4px;
        }
        .kpi-value-row {
          display: flex; align-items: baseline; gap: 4px;
        }
        .kpi-value {
          font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700;
        }
        .kpi-unit {
          font-size: 14px; font-weight: 400; opacity: 0.8;
        }

        /* User Profile Icon Placeholder (Right side of bottom bar) */
        .user-profile {
          display: flex; align-items: center; gap: 12px; opacity: 0.8;
        }
        .icon-circle { width: 32px; height: 32px; border-radius: 50%; background: #ddd; }

      </style>

      <div class="viz-container" id="container">
        <div class="video-layer" id="video-layer"></div>

        <nav class="top-nav" id="top-nav"></nav>

        <div class="hero-center">
          <div>
            <div class="brand-title" id="brand-title"></div>
            <div class="brand-subtitle">Collection 2025</div>
          </div>
        </div>

        <div class="bottom-bar" id="bottom-bar">
          <div class="kpi-group" id="kpi-container">
            </div>
          <div class="user-profile" style="display:none;"> <div style="font-size:12px; text-align:right;">Current<br>Location</div>
             <div class="icon-circle" style="background:currentColor;"></div>
          </div>
        </div>
      </div>
    `;
  },

  // --- 更新処理 (Update) [cite: 203, 260] ---
  updateAsync: function(data, element, config, queryResponse, details, done) {
    this.clearErrors(); // エラークリア [cite: 233]

    // DOM要素の取得
    const container = element.querySelector("#container");
    const videoLayer = element.querySelector("#video-layer");
    const topNav = element.querySelector("#top-nav");
    const brandTitle = element.querySelector("#brand-title");
    const bottomBar = element.querySelector("#bottom-bar");
    const kpiContainer = element.querySelector("#kpi-container");

    // 1. カラー＆スタイルの適用
    const mainColor = config.text_color || "#333333";
    const accentColor = config.accent_color || "#AA7777";
    const bgColor = config.bg_color || "#FAF9F8";

    container.style.color = mainColor;
    container.style.backgroundColor = bgColor;

    // Bottom Barの背景色 (アクセントカラーを薄く適用して統一感を出す)
    bottomBar.style.backgroundColor = 'rgba(255,255,255, 0.4)';

    // 2. 動画設定
    const videoUrl = config.video_url;
    const opacity = config.video_opacity || 0.15;
    videoLayer.style.opacity = opacity;

    // 動画リロード防止ロジック
    const currentVideo = videoLayer.querySelector("video");
    if (!currentVideo || currentVideo.dataset.src !== videoUrl) {
      videoLayer.innerHTML = `
        <video class="bg-video" autoplay muted loop playsinline data-src="${videoUrl}">
          <source src="${videoUrl}" type="video/mp4">
        </video>`;
    }

    // 3. ナビゲーション構築
    const items = (config.menu_items || "Dashboard, Products, Metallic Accents, Settings").split(",");
    const activeTab = config.active_tab || "Dashboard";

    let navHTML = "";
    items.forEach(item => {
        const cleanItem = item.trim();
        const isActive = cleanItem === activeTab ? "active" : "";
        const activeColorStyle = isActive ? `style="color: ${accentColor}; border-color: ${accentColor}"` : "";
        navHTML += `<div class="nav-item ${isActive}" ${activeColorStyle}>${cleanItem}</div>`;
    });
    topNav.innerHTML = navHTML;

    // 4. ブランドタイトル
    brandTitle.innerHTML = config.brand_text || "Women's Fashion";
    brandTitle.style.fontSize = `${config.brand_font_size || 72}px`;
    brandTitle.style.color = mainColor;

    // 5. KPI データのレンダリング
    kpiContainer.innerHTML = "";

    if (data && data.length > 0 && queryResponse && queryResponse.fields.measures.length > 0) {
        const row = data[0]; // 1行目のデータを使用
        // メジャーを最大3つまで取得
        const measures = queryResponse.fields.measures.slice(0, 3);

        measures.forEach((measure, index) => {
            const cell = row[measure.name];
            // データ値のフォーマット済みテキストを取得
            const textValue = LookerCharts.Utils.textForCell(cell);
            const label = measure.label_short || measure.label;

            // 設定から単位を取得
            const unit = config[`kpi_unit_${index+1}`] || "";

            // HTML生成
            const kpiDiv = document.createElement("div");
            kpiDiv.className = "kpi-item";
            kpiDiv.innerHTML = `
                <div class="kpi-label" style="color:${accentColor}">${label}</div>
                <div class="kpi-value-row">
                    <div class="kpi-unit" style="color:${mainColor}">${unit}</div>
                    <div class="kpi-value">${textValue}</div>
                </div>
            `;
            kpiContainer.appendChild(kpiDiv);
        });
    }

    // レンダリング完了通知 [cite: 304]
    done();
  }
});
