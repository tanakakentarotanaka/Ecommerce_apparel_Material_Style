/**
 * THE LOOKER ARCHIVE - Custom Viz (Debug Mode)
 */

// --- Helper: 数値フォーマッター ---
function formatNumber(value, pattern) {
  try {
    if (typeof value !== 'number') return value;
    let locale = 'en-US';
    const hasCommaDecimal = /0,[0#]/.test(pattern);
    const hasDotGrouping = /#[.]#/.test(pattern) && !/0\./.test(pattern);
    if (hasCommaDecimal || hasDotGrouping) locale = 'de-DE';

    const decimalSeparator = locale === 'de-DE' ? ',' : '.';
    let decimals = 0;
    if (pattern.includes(decimalSeparator)) {
      const decimalPart = pattern.split(decimalSeparator)[1];
      if (decimalPart) decimals = (decimalPart.match(/0/g) || []).length;
    }

    const groupingSeparator = locale === 'de-DE' ? '.' : ',';
    const useGrouping = pattern.includes(groupingSeparator);

    let formatted = value.toLocaleString(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: useGrouping
    });

    const prefixMatch = pattern.match(/^[^#0\.,]+/);
    if (prefixMatch) formatted = prefixMatch[0] + formatted;
    const suffixMatch = pattern.match(/[^#0\.,]+$/);
    if (suffixMatch) formatted = formatted + suffixMatch[0];

    return formatted;
  } catch (e) {
    console.error("Format Error", e);
    return value;
  }
}

// --- Helper: Youtube ID抽出 (強化版) ---
function getYoutubeId(url) {
  if (!url) return null;
  // 一般的なURL, 短縮URL, 埋め込みURLに対応
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  // IDが11文字であることを確認（誤検知防止）
  return (match && match[2].length === 11) ? match[2] : null;
}

const kpiOptions = {};
for (let i = 1; i <= 10; i++) {
  kpiOptions[`kpi_unit_${i}`] = {
    type: "string",
    label: `KPI ${i} Unit / Format`,
    placeholder: "Unit (e.g. 'USD') or Format (e.g. '#.##0')",
    section: "3. KPIs",
    order: i
  };
}

looker.plugins.visualizations.add({
  options: {
    // 1. BRANDING
    brand_text: { type: "string", label: "Brand Title", default: "THE LOOKER ARCHIVE", section: "1. Brand", order: 1 },
    brand_subtitle: { type: "string", label: "Brand Subtitle", default: "D A T A  C O U T U R E", section: "1. Brand", order: 2 },
    brand_font_size: { type: "number", label: "Title Size (px)", default: 72, section: "1. Brand", order: 3 },

    // 2. MENU CONFIG
    active_tab: { type: "string", label: "Active Tab Name", default: "Dashboard", section: "2. Menu", order: 1 },
    menu_items: { type: "string", label: "Menu Items (Comma separated)", default: "Dashboard, Collection, Analysis, Settings", section: "2. Menu", order: 2 },
    menu_links: { type: "string", label: "Menu Links (Comma separated)", default: "", placeholder: "https://..., https://...", section: "2. Menu", order: 3 },
    menu_link_target: {
      type: "string",
      label: "Open Links In",
      display: "select",
      values: [ { "New Tab": "_blank" }, { "Same Tab": "_self" } ],
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
    video_url: { type: "string", label: "Video URL (MP4 or Youtube)", default: "https://videos.pexels.com/video-files/3205934/3205934-hd_1920_1080_25fps.mp4", section: "4. Style" },
    video_opacity: { type: "number", label: "Video Opacity", default: 0.15, display: "range", min: 0, max: 1, step: 0.05, section: "4. Style" },
  },

  create: function(element, config) {
    // HTML構造を定義
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
        .bg-iframe { width: 100%; height: 100%; border: none; object-fit: cover; transform: scale(1.3); pointer-events: none; }

        .top-nav {
          position: relative; z-index: 2; width: 100%; padding: 24px 40px; display: flex; gap: 40px;
        }
        .nav-item {
          font-size: 14px; letter-spacing: 0.05em; opacity: 0.6; cursor: pointer; text-decoration: none; color: inherit;
        }
        .nav-item.active { opacity: 1; border-bottom: 2px solid currentColor; }

        .hero-center {
          position: relative; z-index: 2; flex-grow: 1; display: flex; align-items: center; justify-content: center; text-align: center;
        }
        .brand-title { font-family: 'Playfair Display', serif; line-height: 1.1; }
        .brand-subtitle { font-family: 'Inter', sans-serif; font-size: 12px; letter-spacing: 0.25em; text-transform: uppercase; margin-top: 16px; opacity: 0.6; }

        .bottom-bar {
          position: relative; z-index: 2; width: 100%; padding: 20px 40px; display: flex; align-items: flex-end;
          backdrop-filter: blur(5px); border-top: 1px solid rgba(0,0,0,0.05);
        }
        .kpi-group { display: flex; gap: 60px; overflow-x: auto; padding-bottom: 5px; }
        .kpi-item { display: flex; flex-direction: column; align-items: flex-start; flex-shrink: 0; }
        .kpi-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.7; margin-bottom: 4px; }
        .kpi-value-row { display: flex; align-items: baseline; gap: 4px; }
        .kpi-value { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700; white-space: nowrap; }
        .kpi-unit { font-size: 14px; font-weight: 400; opacity: 0.8; }

        /* エラー表示用 */
        #error-log {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(255,255,255,0.9); color: red; z-index: 9999; padding: 20px;
            white-space: pre-wrap; display: none; pointer-events: none;
        }
      </style>

      <div class="viz-container" id="container">
        <div id="error-log"></div>
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

  updateAsync: function(data, element, config, queryResponse, details, done) {
    // --- エラーハンドリング開始 ---
    const errorLog = element.querySelector("#error-log");
    try {
        this.clearErrors();
        if (errorLog) errorLog.style.display = 'none';

        const container = element.querySelector("#container");
        const videoLayer = element.querySelector("#video-layer");
        const topNav = element.querySelector("#top-nav");
        const brandTitle = element.querySelector("#brand-title");
        const brandSubtitle = element.querySelector("#brand-subtitle");
        const bottomBar = element.querySelector("#bottom-bar");
        const kpiContainer = element.querySelector("#kpi-container");

        // 要素が見つからない場合は終了（タイミング問題の回避）
        if (!container || !videoLayer) {
             return;
        }

        const mainColor = config.text_color || "#333333";
        const accentColor = config.accent_color || "#AA7777";
        const bgColor = config.bg_color || "#FAF9F8";

        container.style.color = mainColor;
        container.style.backgroundColor = bgColor;
        bottomBar.style.backgroundColor = 'rgba(255,255,255, 0.4)';

        // --- VIDEO HANDLING ---
        const videoUrl = config.video_url;
        videoLayer.style.opacity = config.video_opacity || 0.15;

        // URLが変更された場合のみ再描画
        const currentSrc = videoLayer.dataset.currentSrc;
        if (videoUrl && currentSrc !== videoUrl) {
            videoLayer.dataset.currentSrc = videoUrl;

            const youtubeId = getYoutubeId(videoUrl);

            if (youtubeId) {
                // Youtube Case
                // autoplay=1, mute=1 は必須。playlistにIDを渡すことでループさせる
                const embedUrl = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${youtubeId}&playsinline=1&showinfo=0&rel=0&disablekb=1&iv_load_policy=3&enablejsapi=1`;

                videoLayer.innerHTML = `
                    <iframe class="bg-iframe"
                        src="${embedUrl}"
                        frameborder="0"
                        allow="autoplay; encrypted-media"
                        allowfullscreen
                        sandbox="allow-scripts allow-same-origin allow-presentation">
                    </iframe>
                `;
            } else {
                // Direct Video File Case
                videoLayer.innerHTML = `
                    <video class="bg-video"
                      autoplay muted loop playsinline preload="auto"
                      data-src="${videoUrl}">
                        <source src="${videoUrl}" type="video/mp4">
                    </video>`;
            }
        } else if (!videoUrl) {
            videoLayer.innerHTML = ""; // URLがない場合はクリア
        }

        // --- Navigation ---
        const items = (config.menu_items || "").split(",");
        const links = (config.menu_links || "").split(",");
        const activeTab = config.active_tab || "Dashboard";
        const target = config.menu_link_target || "_blank";

        topNav.innerHTML = items.map((item, index) => {
          const cleanLabel = item.trim();
          const cleanLink = links[index] ? links[index].trim() : "";
          const isActive = cleanLabel === activeTab;
          const activeClass = isActive ? "active" : "";
          const style = isActive ? `style="color: ${accentColor}; border-color: ${accentColor}"` : "";

          if (cleanLink) {
            return `<a href="${cleanLink}" class="nav-item ${activeClass}" ${style} target="${target}">${cleanLabel}</a>`;
          } else {
            return `<div class="nav-item ${activeClass}" ${style}>${cleanLabel}</div>`;
          }
        }).join("");

        brandTitle.innerHTML = config.brand_text || "THE LOOKER ARCHIVE";
        brandTitle.style.fontSize = `${config.brand_font_size || 72}px`;
        brandSubtitle.innerHTML = config.brand_subtitle || "D A T A  C O U T U R E";

        // --- KPIs ---
        kpiContainer.innerHTML = "";
        if (data && data.length > 0 && queryResponse && queryResponse.fields.measures.length > 0) {
            const row = data[0];
            const measures = queryResponse.fields.measures.slice(0, 10);

            measures.forEach((measure, index) => {
                const cell = row[measure.name];
                let textValue = "";
                let unitText = "";
                const unitOrFormat = config[`kpi_unit_${index+1}`] || "";

                if (unitOrFormat && /[#0]/.test(unitOrFormat)) {
                   textValue = formatNumber(cell.value, unitOrFormat);
                   unitText = "";
                } else {
                   // LookerChartsが未定義の場合のガード
                   textValue = (typeof LookerCharts !== 'undefined') ? LookerCharts.Utils.textForCell(cell) : cell.value;
                   unitText = unitOrFormat;
                }

                const label = measure.label_short || measure.label;
                const kpiDiv = document.createElement("div");
                kpiDiv.className = "kpi-item";
                kpiDiv.innerHTML = `
                    <div class="kpi-label" style="color:${accentColor}">${label}</div>
                    <div class="kpi-value-row">
                        <div class="kpi-value">${textValue}</div>
                        <div class="kpi-unit" style="color:${mainColor}">${unitText}</div>
                    </div>
                `;
                kpiContainer.appendChild(kpiDiv);
            });
        }
    } catch (e) {
        // エラーが発生した場合、画面上に表示する
        if (errorLog) {
            errorLog.style.display = 'block';
            errorLog.innerText = "Script Error:\n" + e.toString() + "\n" + e.stack;
        }
        console.error(e);
    }
    done();
  }
});
