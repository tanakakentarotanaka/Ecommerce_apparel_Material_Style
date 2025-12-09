/**
 * THE LOOKER ARCHIVE - Custom Viz
 * Layout: Top Menu | Center Hero | Bottom KPI Ticker (Max 10)
 */

const kpiOptions = {};
for (let i = 1; i <= 10; i++) {
  kpiOptions[`kpi_unit_${i}`] = {
    label: `KPI ${i} Unit`,
    placeholder: "Unit",
    section: "3. KPIs",
    order: i
  };
}

looker.plugins.visualizations.add({
  // --- 設定オプション (Configuration) ---
  options: {
    // 1. BRANDING
    brand_text: { type: "string", label: "Brand Title", default: "THE LOOKER ARCHIVE", section: "1. Brand", order: 1 },
    brand_subtitle: { type: "string", label: "Brand Subtitle", default: "D A T A  C O U T U R E", section: "1. Brand", order: 2 },
    brand_font_size: { type: "number", label: "Title Size (px)", default: 72, section: "1. Brand", order: 3 },

    // 2. MENU CONFIG
    active_tab: { type: "string", label: "Active Tab Name", default: "Dashboard", section: "2. Menu", order: 1 },
    menu_items: { type: "string", label: "Menu Items (Comma separated)", default: "Dashboard, Collection, Analysis, Settings", section: "2. Menu", order: 2 },
    menu_links: { type: "string", label: "Menu Links (Comma separated)", default: "", placeholder: "https://..., https://...", section: "2. Menu", order: 3 },
    // ★追加: リンクの開き方を選択するオプション
    menu_link_target: {
      type: "string",
      label: "Open Links In",
      display: "select",
      values: [
        { "New Tab": "_blank" },
        { "Same Tab": "_self" }
      ],
      default: "_blank",
      section: "2. Menu",
      order: 4
    },

    // 3. KPIs
    ...kpiOptions,

    // 4. STYLING
    text_color: { type: "string", label: "Main Text Color", default: "#333333", display: "color", section: "4. Style" },
    accent_color: { type: "string", label: "Accent Color", default: "#AA7777", display: "color", section: "4. Style" },
    bg_color: { type: "string", label: "Background Color", default: "#FAF9F8", display: "color", section: "4. Style" },
    video_url: { type: "string", label: "Video URL", default: "https://videos.pexels.com/video-files/3205934/3205934-hd_1920_1080_25fps.mp4", section: "4. Style" },
    video_opacity: { type: "number", label: "Video Opacity", default: 0.15, display: "range", min: 0, max: 1, step: 0.05, section: "4. Style" },
  },

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
        .video-layer {
          position: absolute; top: 0; left: 0; width: 100%; height: 100%;
          z-index: 0; pointer-events: none; mix-blend-mode: multiply;
        }
        .bg-video { width: 100%; height: 100%; object-fit: cover; }

        /* Navigation */
        .top-nav {
          position: relative; z-index: 2;
          width: 100%; padding: 24px 40px;
          display: flex; gap: 40px;
        }
        .nav-item {
          font-size: 14px; letter-spacing: 0.05em; opacity: 0.6; cursor: pointer;
          position: relative; transition: opacity 0.3s;
          text-decoration: none;
          color: inherit;
        }
        .nav-item:hover, .nav-item.active { opacity: 1; }
        .nav-item.active::after {
          content: ''; position: absolute; bottom: -8px; left: 0; width: 100%; height: 2px; background-color: currentColor;
        }

        /* Hero Center */
        .hero-center {
          position: relative; z-index: 2;
          flex-grow: 1; display: flex; align-items: center; justify-content: center;
          text-align: center;
        }
        .brand-title { font-family: 'Playfair Display', serif; line-height: 1.1; }
        .brand-subtitle { font-family: 'Inter', sans-serif; font-size: 12px; letter-spacing: 0.25em; text-transform: uppercase; margin-top: 16px; opacity: 0.6; }

        /* Bottom KPI Bar */
        .bottom-bar {
          position: relative; z-index: 2;
          width: 100%; padding: 20px 40px;
          display: flex; align-items: flex-end;
          backdrop-filter: blur(5px);
          border-top: 1px solid rgba(0,0,0,0.05);
          overflow: hidden;
        }
        .kpi-group {
          display: flex; gap: 60px; overflow-x: auto; padding-bottom: 5px;
          -ms-overflow-style: none; scrollbar-width: none;
        }
        .kpi-group::-webkit-scrollbar { display: none; }
        .kpi-item { display: flex; flex-direction: column; align-items: flex-start; flex-shrink: 0; }
        .kpi-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.7; margin-bottom: 4px; }
        .kpi-value-row { display: flex; align-items: baseline; gap: 4px; }
        .kpi-value { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700; white-space: nowrap; }
        .kpi-unit { font-size: 14px; font-weight: 400; opacity: 0.8; }
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
          <div class="kpi-group" id="kpi-container"></div>
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

    const mainColor = config.text_color || "#333333";
    const accentColor = config.accent_color || "#AA7777";
    const bgColor = config.bg_color || "#FAF9F8";

    container.style.color = mainColor;
    container.style.backgroundColor = bgColor;
    bottomBar.style.backgroundColor = 'rgba(255,255,255, 0.4)';

    const videoUrl = config.video_url;
    videoLayer.style.opacity = config.video_opacity || 0.15;
    const currentVideo = videoLayer.querySelector("video");
    if (!currentVideo || currentVideo.dataset.src !== videoUrl) {
      videoLayer.innerHTML = `<video class="bg-video" autoplay muted loop playsinline data-src="${videoUrl}"><source src="${videoUrl}" type="video/mp4"></video>`;
    }

    // Navigation
    const items = (config.menu_items || "").split(",");
    const links = (config.menu_links || "").split(",");
    const activeTab = config.active_tab || "Dashboard";
    // ★追加: リンク設定を取得
    const target = config.menu_link_target || "_blank";

    topNav.innerHTML = items.map((item, index) => {
      const cleanLabel = item.trim();
      const cleanLink = links[index] ? links[index].trim() : "";

      const isActive = cleanLabel === activeTab;
      const activeClass = isActive ? "active" : "";
      const style = isActive ? `style="color: ${accentColor}; border-color: ${accentColor}"` : "";

      if (cleanLink) {
        // ★修正: target属性に設定値を反映
        return `<a href="${cleanLink}" class="nav-item ${activeClass}" ${style} target="${target}">${cleanLabel}</a>`;
      } else {
        return `<div class="nav-item ${activeClass}" ${style}>${cleanLabel}</div>`;
      }
    }).join("");

    brandTitle.innerHTML = config.brand_text || "THE LOOKER ARCHIVE";
    brandTitle.style.fontSize = `${config.brand_font_size || 72}px`;
    brandSubtitle.innerHTML = config.brand_subtitle || "D A T A  C O U T U R E";

    kpiContainer.innerHTML = "";
    if (data && data.length > 0 && queryResponse && queryResponse.fields.measures.length > 0) {
        const row = data[0];
        const measures = queryResponse.fields.measures.slice(0, 10);
        measures.forEach((measure, index) => {
            const cell = row[measure.name];
            const textValue = LookerCharts.Utils.textForCell(cell);
            const label = measure.label_short || measure.label;
            const unit = config[`kpi_unit_${index+1}`] || "";

            const kpiDiv = document.createElement("div");
            kpiDiv.className = "kpi-item";
            kpiDiv.innerHTML = `
                <div class="kpi-label" style="color:${accentColor}">${label}</div>
                <div class="kpi-value-row">
                    <div class="kpi-value">${textValue}</div>
                    <div class="kpi-unit" style="color:${mainColor}">${unit}</div>
                </div>
            `;
            kpiContainer.appendChild(kpiDiv);
        });
    }

    done();
  }
});
