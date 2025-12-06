/**
 * Fashion BI Hero Video Menu (Format Control Edition)
 * Customizable Number Formatting (Decimals) & Units.
 */

looker.plugins.visualizations.add({
  // 設定オプション
  options: {
    // --- ブランドロゴ設定 ---
    brand_text_main: { type: "string", label: "Brand Text (Main)", default: "FASHION", section: "Brand", order: 1 },
    brand_text_accent: { type: "string", label: "Brand Text (Accent)", default: "NOVA", section: "Brand", order: 2 },

    // --- KPIデザイン設定 ---
    kpi_value_color: { type: "string", label: "KPI Value Color", default: "#FFFFFF", display: "color", section: "KPI Design", order: 1 },
    kpi_value_size: { type: "number", label: "KPI Value Size (px)", default: 42, display: "number", section: "KPI Design", order: 2 },
    kpi_label_color: { type: "string", label: "KPI Label Color", default: "#E0E0E0", display: "color", section: "KPI Design", order: 3 },
    kpi_label_size: { type: "number", label: "KPI Label Size (px)", default: 11, display: "number", section: "KPI Design", order: 4 },

    // --- KPI 1 設定 ---
    kpi_label_1: { type: "string", label: "KPI 1 Label", placeholder: "Override Label", section: "KPI 1", order: 1 },
    kpi_decimals_1: { type: "number", label: "KPI 1 Decimals", placeholder: "0, 1, 2...", section: "KPI 1", order: 2 }, // 新規: 桁数設定
    kpi_unit_1: { type: "string", label: "KPI 1 Unit", placeholder: "e.g. $", section: "KPI 1", order: 3 },
    kpi_unit_pos_1: { type: "string", label: "Unit Position", default: "left", values: [{"Left": "left"}, {"Right": "right"}], display: "select", section: "KPI 1", order: 4 },

    // --- KPI 2 設定 ---
    kpi_label_2: { type: "string", label: "KPI 2 Label", placeholder: "Override Label", section: "KPI 2", order: 1 },
    kpi_decimals_2: { type: "number", label: "KPI 2 Decimals", placeholder: "0, 1, 2...", section: "KPI 2", order: 2 }, // 新規
    kpi_unit_2: { type: "string", label: "KPI 2 Unit", placeholder: "e.g. 円", section: "KPI 2", order: 3 },
    kpi_unit_pos_2: { type: "string", label: "Unit Position", default: "right", values: [{"Left": "left"}, {"Right": "right"}], display: "select", section: "KPI 2", order: 4 },

    // --- KPI 3 設定 ---
    kpi_label_3: { type: "string", label: "KPI 3 Label", placeholder: "Override Label", section: "KPI 3", order: 1 },
    kpi_decimals_3: { type: "number", label: "KPI 3 Decimals", placeholder: "0, 1, 2...", section: "KPI 3", order: 2 }, // 新規
    kpi_unit_3: { type: "string", label: "KPI 3 Unit", placeholder: "e.g. items", section: "KPI 3", order: 3 },
    kpi_unit_pos_3: { type: "string", label: "Unit Position", default: "right", values: [{"Left": "left"}, {"Right": "right"}], display: "select", section: "KPI 3", order: 4 },

    // --- 位置・スタイル設定 ---
    padding_x: { type: "number", label: "Horizontal Padding (px)", default: 60, section: "Position" },

    overlay_color: { type: "string", label: "Overlay Color", default: "#000000", display: "color", section: "Style" },
    overlay_opacity: { type: "number", label: "Overlay Opacity (0-1)", default: 0.4, display: "range", min: 0, max: 1, step: 0.05, section: "Style" },
    text_color: { type: "string", label: "Brand Color", default: "#FFFFFF", display: "color", section: "Style" },
    accent_color: { type: "string", label: "Accent Color", default: "#AA7777", display: "color", section: "Style" },
    menu_text_color: { type: "string", label: "Menu Text Color", default: "#FFFFFF", display: "color", section: "Style" },
    video_url: { type: "string", label: "Video URL (MP4)", default: "https://videos.pexels.com/video-files/3205934/3205934-hd_1920_1080_25fps.mp4", section: "Video" },

    // --- メニュー内容設定 ---
    active_tab: { type: "string", label: "Active Tab Name", default: "Products", section: "Menu Config" },
    menu_label_1: { type: "string", label: "Menu 1 Label", default: "Dashboard", section: "Menu Config" },
    menu_link_1: { type: "string", label: "Menu 1 Link", default: "/dashboards/1", section: "Menu Config" },
    menu_label_2: { type: "string", label: "Menu 2 Label", default: "Products", section: "Menu Config" },
    menu_link_2: { type: "string", label: "Menu 2 Link", default: "/dashboards/2", section: "Menu Config" },
    menu_label_3: { type: "string", label: "Menu 3 Label", default: "Campaigns", section: "Menu Config" },
    menu_link_3: { type: "string", label: "Menu 3 Link", default: "/dashboards/3", section: "Menu Config" },
    menu_label_4: { type: "string", label: "Menu 4 Label", default: "Settings", section: "Menu Config" },
    menu_link_4: { type: "string", label: "Menu 4 Link", default: "/dashboards/settings", section: "Menu Config" }
  },

  create: function(element, config) {
    element.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;700&family=Playfair+Display:wght@400;700&display=swap');

        .hero-container {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
          background-color: #222;
        }
        .video-wrapper, .overlay {
          position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        }
        .video-wrapper { z-index: 0; pointer-events: none; }
        .overlay { z-index: 1; }
        .bg-video {
          position: absolute; top: 50%; left: 50%;
          min-width: 100%; min-height: 100%;
          width: auto; height: auto;
          transform: translate(-50%, -50%);
          object-fit: cover;
        }
        .menu-content {
          position: relative; z-index: 2;
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: space-between;
          box-sizing: border-box;
        }
        .left-panel { display: flex; flex-direction: column; gap: 24px; }
        .brand-logo {
          font-family: 'Playfair Display', serif;
          font-size: 42px; font-weight: 400; letter-spacing: 2px; line-height: 1;
        }
        .nav-links {
          display: flex; flex-direction: column; gap: 8px;
          border-left: 1px solid rgba(255,255,255,0.3); padding-left: 20px;
        }
        .nav-item {
          font-size: 13px; font-weight: 400; letter-spacing: 1.5px;
          text-transform: uppercase; text-decoration: none;
          cursor: pointer; transition: all 0.3s ease;
          position: relative; display: flex; align-items: center; opacity: 0.7;
        }
        .nav-item:hover, .nav-item.active { transform: translateX(5px); opacity: 1; }
        .nav-item.active { font-weight: 600; cursor: default; }
        .nav-item.active::before {
          content: ''; position: absolute; left: -23px; top: 50%;
          transform: translateY(-50%); width: 3px; height: 100%;
          background-color: currentColor;
        }
        .right-panel { display: flex; gap: 40px; text-align: right; align-items: flex-start; }
        .kpi-item {
          display: flex; flex-direction: column; align-items: flex-end;
          animation: fadeIn 1s ease forwards;
        }
        .kpi-value-group { display: flex; align-items: baseline; gap: 4px; }
        .kpi-value { font-family: 'Playfair Display', serif; font-weight: 700; line-height: 1; }
        .kpi-unit {
          font-family: 'Inter', sans-serif; font-weight: 500; opacity: 0.8;
          font-size: 0.5em; /* 値の半分のサイズ */
        }
        .kpi-label {
          text-transform: uppercase; letter-spacing: 1px; margin-top: 6px;
          opacity: 0.8; border-top: 1px solid rgba(255,255,255,0.3); padding-top: 4px;
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      </style>

      <div id="viz-root" class="hero-container">
        <div class="video-wrapper" id="video-wrapper"></div>
        <div class="overlay" id="color-overlay"></div>
        <div class="menu-content" id="menu-content">
          <div class="left-panel">
            <div class="brand-logo" id="brand-logo"></div>
            <div class="nav-links" id="nav-links"></div>
          </div>
          <div class="right-panel" id="right-panel"></div>
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
    const rightPanel = element.querySelector("#right-panel");

    this.clearErrors();

    // 1. 動画再生
    const videoUrl = config.video_url || "https://videos.pexels.com/video-files/3205934/3205934-hd_1920_1080_25fps.mp4";
    const currentVideo = videoWrapper.querySelector("video");
    if (!currentVideo || currentVideo.src !== videoUrl) {
      videoWrapper.innerHTML = `<video class="bg-video" autoplay muted loop playsinline><source src="${videoUrl}" type="video/mp4"></video>`;
    }

    // 2. 基本デザイン適用
    colorOverlay.style.backgroundColor = config.overlay_color;
    colorOverlay.style.opacity = config.overlay_opacity;
    menuContent.style.padding = `0 ${config.padding_x || 60}px`;

    const mainColor = config.text_color || "#FFFFFF";
    const accentColor = config.accent_color || "#AA7777";
    const menuTextColor = config.menu_text_color || "#FFFFFF";

    brandLogo.style.color = mainColor;
    brandLogo.innerHTML = `${config.brand_text_main || "FASHION"} <span style="color: ${accentColor}; font-weight: 700;">${config.brand_text_accent || "NOVA"}</span>`;

    // 3. ナビゲーション生成
    const activeTab = config.active_tab || "Products";
    const menuItems = [];
    for (let i = 1; i <= 4; i++) {
      if (config[`menu_label_${i}`]) menuItems.push({ name: config[`menu_label_${i}`], link: config[`menu_link_${i}`] });
    }
    if (menuItems.length === 0) menuItems.push({ name: "Dashboard", link: "#" }, { name: "Products", link: "#" });

    navLinksContainer.innerHTML = "";
    navLinksContainer.style.borderLeftColor = menuTextColor;

    const styleId = "hero-dynamic-style";
    let styleTag = document.getElementById(styleId);
    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }
    styleTag.innerHTML = `.nav-item.active::before { background-color: ${accentColor} !important; }`;

    menuItems.forEach(item => {
      const isActive = (item.name === activeTab);
      const el = document.createElement(isActive ? "div" : "a");
      el.className = isActive ? "nav-item active" : "nav-item";
      if (!isActive) el.href = item.link;
      el.innerText = item.name;
      el.style.color = menuTextColor;
      navLinksContainer.appendChild(el);
    });

    // 4. KPI表示 (桁数フォーマット機能追加)
    rightPanel.innerHTML = "";

    const valColor = config.kpi_value_color || "#FFFFFF";
    const valSize = config.kpi_value_size || 42;
    const lblColor = config.kpi_label_color || "#E0E0E0";
    const lblSize = config.kpi_label_size || 11;

    if (data && data.length > 0 && queryResponse && queryResponse.fields.measures.length > 0) {
      const firstRow = data[0];
      const measures = queryResponse.fields.measures;
      const maxKpis = Math.min(measures.length, 3);

      for (let i = 0; i < maxKpis; i++) {
        const measure = measures[i];
        const cell = firstRow[measure.name];
        const confIndex = i + 1;

        const customLabel = config[`kpi_label_${confIndex}`] || measure.label_short || measure.label;
        const customUnit = config[`kpi_unit_${confIndex}`] || "";
        const unitPos = config[`kpi_unit_pos_${confIndex}`] || "right";
        const decimals = config[`kpi_decimals_${confIndex}`]; // 小数桁数 (nullならLooker形式)

        let displayValue = "";

        // --- フォーマットロジック ---
        if (cell.value != null && decimals != null && decimals !== "") {
          [cite_start]// JSで数値をフォーマット (カンマ区切り + 指定桁数) [cite: 252]
          // 例: 1234.5 -> "1,234.5" (decimals=1)
          const num = Number(cell.value);
          if (!isNaN(num)) {
            displayValue = num.toLocaleString('en-US', {
              minimumFractionDigits: Number(decimals),
              maximumFractionDigits: Number(decimals)
            });
          } else {
            displayValue = LookerCharts.Utils.textForCell(cell);
          }
        } else {
          // 設定がなければLookerのデフォルトフォーマットを使用
          displayValue = LookerCharts.Utils.textForCell(cell);
        }

        const kpiItem = document.createElement("div");
        kpiItem.className = "kpi-item";

        // HTML構築
        const unitSpan = `<span class="kpi-unit" style="color:${valColor}">${customUnit}</span>`;
        const valueSpan = `<span class="kpi-value" style="color:${valColor}; font-size:${valSize}px;">${displayValue}</span>`;

        // スペース調整 (右単位の場合のみ少し隙間を空ける)
        let valueHTML = "";
        if (unitPos === "left") {
            valueHTML = unitSpan + valueSpan; // 左単位 ($100) は隙間なしが一般的
        } else {
            valueHTML = valueSpan + `<span style="width:4px; display:inline-block;"></span>` + unitSpan;
        }

        kpiItem.innerHTML = `
          <div class="kpi-value-group">
            ${valueHTML}
          </div>
          <div class="kpi-label" style="color:${lblColor}; font-size:${lblSize}px;">
            ${customLabel}
          </div>
        `;

        rightPanel.appendChild(kpiItem);
      }
    }

    done();
  }
});
