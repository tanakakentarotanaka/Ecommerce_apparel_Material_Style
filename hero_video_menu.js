/**
 * Fashion BI Hero - "THE LOOKER ARCHIVE" Edition
 * Features:
 * - Up to 10 Scrollable KPIs
 * - Drill-down support
 * - Dynamic Options Generation
 */

// オプション設定を動的に生成（コードを簡潔に保つため）
const dynamicOptions = {
    // 1. BRANDING
    brand_text: { type: "string", label: "Brand Title", default: "THE LOOKER ARCHIVE", section: "1. Brand", order: 1 },
    brand_font_size: { type: "number", label: "Title Size (px)", default: 72, section: "1. Brand", order: 2 },
    brand_subtitle: { type: "string", label: "Brand Subtitle", default: "EST. 2025", section: "1. Brand", order: 3 },

    // 2. MENU CONFIG
    active_tab: { type: "string", label: "Active Tab Name", default: "Dashboard", section: "2. Menu" },
    menu_items: { type: "string", label: "Menu Items (comma separated)", default: "Dashboard, Collection, Archives, Settings", section: "2. Menu" },

    // 4. STYLING
    text_color: { type: "string", label: "Main Text Color", default: "#333333", display: "color", section: "4. Style" },
    accent_color: { type: "string", label: "Accent Color", default: "#AA7777", display: "color", section: "4. Style" },
    bg_color: { type: "string", label: "Background Color", default: "#FAF9F8", display: "color", section: "4. Style" },
    video_url: { type: "string", label: "Video URL", default: "https://videos.pexels.com/video-files/3205934/3205934-hd_1920_1080_25fps.mp4", section: "4. Style" },
    video_opacity: { type: "number", label: "Video Opacity", default: 0.15, display: "range", min: 0, max: 1, step: 0.05, section: "4. Style" },
};

// KPI設定 (1～10) をループで追加
for (let i = 1; i <= 10; i++) {
    dynamicOptions[`kpi_unit_${i}`] = {
        type: "string",
        label: `KPI ${i} Unit`,
        placeholder: i === 1 ? "$" : "",
        section: "3. KPIs",
        order: i
    };
}

looker.plugins.visualizations.add({
  // 生成したオプションを使用
  options: dynamicOptions,

  // --- 初期化 (Create) ---
  create: function(element, config) {
    element.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');

        .viz-container {
          font-family: 'Inter', sans-serif;
          width: 100%; height: 100%;
          position: relative; overflow: hidden;
          display: flex; flex-direction: column; justify-content: space-between;
          background-color: #FAF9F8;
        }

        /* Video Layer */
        .video-layer {
          position: absolute; top: 0; left: 0; width: 100%; height: 100%;
          z-index: 0; pointer-events: none; mix-blend-mode: multiply;
        }
        .bg-video { width: 100%; height: 100%; object-fit: cover; }

        /* Top Nav */
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
        .nav-item:hover, .nav-item.active { opacity: 1; }
        .nav-item.active { font-weight: 500; }
        .nav-item.active::after {
          content: ''; position: absolute; bottom: -8px; left: 0;
          width: 100%; height: 2px; background-color: currentColor;
        }

        /* Center Hero */
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

        /* Bottom KPI Bar (Scrollable) */
        .bottom-bar {
          position: relative; z-index: 2;
          width: 100%; padding: 20px 0 20px 40px; /* 右パディングはスクロールのため0に */
          display: flex; align-items: flex-end;
          box-sizing: border-box;
          backdrop-filter: blur(5px);
          border-top: 1px solid rgba(0,0,0,0.05);
          overflow: hidden; /* コンテナ自体ははみ出しを隠す */
        }

        .kpi-scroll-wrapper {
          width: 100%;
          overflow-x: auto; /* 横スクロール有効化 */
          padding-right: 40px; /* スクロール終端の余白 */

          /* スクロールバー非表示 (Chrome, Safari, Opera) */
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
        .kpi-scroll-wrapper::-webkit-scrollbar {
          display: none;
        }

        .kpi-group {
          display: flex; gap: 60px;
          white-space: nowrap; /* 折り返し防止 */
        }

        .kpi-item {
          display: flex; flex-direction: column; align-items: flex-start;
          cursor: pointer; /* クリック可能であることを示す */
          transition: transform 0.2s ease, opacity 0.2s;
        }
        .kpi-item:hover {
          opacity: 0.8; transform: translateY(-2px);
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

      </style>

      <div class="viz-container" id="container">
        <div class="video-layer" id="video-layer"></div>
        <nav class="top-nav" id="top-nav"></nav>

        <div class="hero-center">
          <div>
            <div class="brand-title" id="brand-title"></div>
            <div class="brand-subtitle" id="brand-subtitle"></div>
          </div>
        </div>

        <div class="bottom-bar" id="bottom-bar">
          <div class="kpi-scroll-wrapper">
            <div class="kpi-group" id="kpi-container">
              </div>
          </div>
        </div>
      </div>
    `;
  },

  // --- 更新処理 (Update) ---
  updateAsync: function(data, element, config, queryResponse, details, done) {
    this.clearErrors();

    const container = element.querySelector("#container");
    const videoLayer = element.querySelector("#video-layer");
    const topNav = element.querySelector("#top-nav");
    const brandTitle = element.querySelector("#brand-title");
    const brandSubtitle = element.querySelector("#brand-subtitle");
    const bottomBar = element.querySelector("#bottom-bar");
    const kpiContainer = element.querySelector("#kpi-container");

    // Style Apply
    const mainColor = config.text_color || "#333333";
    const accentColor = config.accent_color || "#AA7777";
    const bgColor = config.bg_color || "#FAF9F8";

    container.style.color = mainColor;
    container.style.backgroundColor = bgColor;
    bottomBar.style.backgroundColor = 'rgba(255,255,255, 0.4)';

    // Video
    const videoUrl = config.video_url;
    videoLayer.style.opacity = config.video_opacity || 0.15;
    const currentVideo = videoLayer.querySelector("video");
    if (!currentVideo || currentVideo.dataset.src !== videoUrl) {
      videoLayer.innerHTML = `<video class="bg-video" autoplay muted loop playsinline data-src="${videoUrl}"><source src="${videoUrl}" type="video/mp4"></video>`;
    }

    // Navigation
    const items = (config.menu_items || "").split(",");
    const activeTab = config.active_tab || "Dashboard";
    let navHTML = "";
    items.forEach(item => {
        const cleanItem = item.trim();
        const isActive = cleanItem === activeTab;
        const style = isActive ? `style="color: ${accentColor}; border-color: ${accentColor}"` : "";
        navHTML += `<div class="nav-item ${isActive ? 'active' : ''}" ${style}>${cleanItem}</div>`;
    });
    topNav.innerHTML = navHTML;

    // Brand
    brandTitle.innerHTML = config.brand_text || "THE LOOKER ARCHIVE";
    brandTitle.style.fontSize = `${config.brand_font_size || 72}px`;
    brandTitle.style.color = mainColor;
    brandSubtitle.innerHTML = config.brand_subtitle || "EST. 2025";
    brandSubtitle.style.color = mainColor;

    // KPI Rendering (Max 10)
    kpiContainer.innerHTML = "";

    if (data && data.length > 0 && queryResponse && queryResponse.fields.measures.length > 0) {
        const row = data[0];
        // 最大10個のメジャーを取得
        const measures = queryResponse.fields.measures.slice(0, 10);

        measures.forEach((measure, index) => {
            const cell = row[measure.name];
            const textValue = LookerCharts.Utils.textForCell(cell); [cite: 315]
            const label = measure.label_short || measure.label;
            const unit = config[`kpi_unit_${index+1}`] || "";

            const kpiDiv = document.createElement("div");
            kpiDiv.className = "kpi-item";
            kpiDiv.innerHTML = `
                <div class="kpi-label" style="color:${accentColor}">${label}</div>
                <div class="kpi-value-row">
                    <div class="kpi-unit" style="color:${mainColor}">${unit}</div>
                    <div class="kpi-value">${textValue}</div>
                </div>
            `;

            // ドリルダウンの実装
            // APIリファレンス: LookerCharts.Utils.openDrillMenu(options)
            kpiDiv.onclick = (event) => {
                LookerCharts.Utils.openDrillMenu({
                    links: cell.links, // LookMLで定義されたドリルリンクを使用
                    event: event
                });
            };

            kpiContainer.appendChild(kpiDiv);
        });
    }

    done(); [cite: 303]
  }
});
