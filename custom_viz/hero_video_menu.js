/**
 * THE LOOKER ARCHIVE - Custom Viz
 * Layout: Top Menu | Center Hero | Bottom KPI Ticker (Max 10)
 * Update: Menu items are now individual fields (Max 12).
 */

// --- Helper: 数値フォーマッター ---
function formatNumber(value, pattern) {
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
}

// --- Options Generator: KPIs (Max 10) ---
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

// --- Options Generator: Fallback Images (Max 3) ---
const fallbackImageOptions = {};
for (let i = 1; i <= 3; i++) {
    fallbackImageOptions[`fallback_image_${i}`] = {
        type: "string",
        label: `Fallback Image ${i} URL`,
        placeholder: "https://...",
        section: "4. Style - Fallback",
        order: i
    };
}

// --- Options Generator: Menu Items (Max 12) ---
const menuOptions = {};
for (let i = 1; i <= 12; i++) {
  // Menu Label
  menuOptions[`menu_label_${i}`] = {
    type: "string",
    label: `Menu ${i} Label`,
    default: i === 1 ? "Dashboard" : "", // 1つ目だけデフォルト値を入れる例
    section: "2. Menu",
    order: i * 2 - 1 // 奇数番目 (1, 3, 5...)
  };
  // Menu Link
  menuOptions[`menu_link_${i}`] = {
    type: "string",
    label: `Menu ${i} Link`,
    placeholder: "https://...",
    section: "2. Menu",
    order: i * 2 // 偶数番目 (2, 4, 6...)
  };
}


looker.plugins.visualizations.add({
  _slideshowInterval: null,

  options: {
    // 1. BRANDING
    brand_text: { type: "string", label: "Brand Title", default: "THE LOOKER ARCHIVE", section: "1. Brand", order: 1 },
    brand_subtitle: { type: "string", label: "Brand Subtitle", default: "D A T A  C O U T U R E", section: "1. Brand", order: 2 },
    brand_font_size: { type: "number", label: "Title Size (px)", default: 72, section: "1. Brand", order: 3 },

    // 2. MENU CONFIG
    active_tab: { type: "string", label: "Active Tab Name", default: "Dashboard", section: "2. Menu", order: 0 }, // Order 0 to be at top

    // 展開: Menu 1~12 Options
    ...menuOptions,

    menu_link_target: {
      type: "string",
      label: "Open Links In",
      display: "select",
      values: [ { "New Tab": "_blank" }, { "Same Tab": "_self" } ],
      default: "_blank",
      section: "2. Menu",
      order: 100 // End of section
    },

    // 3. KPIs
    ...kpiOptions,

    // 4. STYLING
    text_color: { type: "string", label: "Main Text Color", default: "#333333", display: "color", section: "4. Style" },
    accent_color: { type: "string", label: "Accent Color", default: "#AA7777", display: "color", section: "4. Style" },
    bg_color: { type: "string", label: "Background Color", default: "#FAF9F8", display: "color", section: "4. Style" },
    video_url: { type: "string", label: "Video URL (MP4 or GIF)", default: "https://videos.pexels.com/video-files/3205934/3205934-hd_1920_1080_25fps.mp4", section: "4. Style" },
    video_opacity: { type: "number", label: "Video/Image Opacity", default: 0.15, display: "range", min: 0, max: 1, step: 0.05, section: "4. Style" },
    ...fallbackImageOptions,
    slideshow_speed: { type: "number", label: "Slideshow Speed (sec)", default: 5, display: "range", min: 2, max: 20, step: 1, section: "4. Style - Fallback" },
  },

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
        .bg-layer {
          position: absolute; top: 0; left: 0; width: 100%; height: 100%;
          z-index: 0; pointer-events: none; mix-blend-mode: multiply;
          overflow: hidden;
          transition: opacity 0.5s ease;
        }
        #video-layer { opacity: 1; }

        .bg-content { width: 100%; height: 100%; object-fit: cover; }

        #slideshow-layer { opacity: 0; }
        .slide-image {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            object-fit: cover;
            opacity: 0;
            transition: opacity 1.5s ease-in-out;
        }
        .slide-image.active { opacity: 1; z-index: 1; }

        .top-nav {
          position: relative; z-index: 2;
          width: 100%; padding: 24px 40px;
          display: flex; gap: 40px;
          flex-wrap: wrap; /* アイテムが多い場合に折り返す */
        }
        .nav-item {
          font-size: 14px; letter-spacing: 0.05em; opacity: 0.6; cursor: pointer;
          position: relative; transition: opacity 0.3s;
          text-decoration: none; color: inherit;
        }
        .nav-item:hover, .nav-item.active { opacity: 1; }
        .nav-item.active::after {
          content: ''; position: absolute; bottom: -8px; left: 0; width: 100%; height: 2px; background-color: currentColor;
        }
        .hero-center {
          position: relative; z-index: 2;
          flex-grow: 1; display: flex; align-items: center; justify-content: center;
          text-align: center;
        }
        .brand-title { font-family: 'Playfair Display', serif; line-height: 1.1; }
        .brand-subtitle { font-family: 'Inter', sans-serif; font-size: 12px; letter-spacing: 0.25em; text-transform: uppercase; margin-top: 16px; opacity: 0.6; }
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
        <div class="bg-layer" id="video-layer"></div>
        <div class="bg-layer" id="slideshow-layer"></div>
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

  startSlideshow: function(config, slideshowLayer, videoLayer) {
    if (this._slideshowInterval) clearInterval(this._slideshowInterval);

    const images = [];
    for (let i = 1; i <= 3; i++) {
        const url = config[`fallback_image_${i}`];
        if (url) images.push(url);
    }

    if (images.length === 0) {
        slideshowLayer.style.opacity = 0;
        return;
    }

    videoLayer.style.opacity = 0;
    slideshowLayer.style.opacity = config.video_opacity || 0.15;

    slideshowLayer.innerHTML = images.map((url, index) => {
        const activeClass = index === 0 ? 'active' : '';
        return `<img src="${url}" class="slide-image ${activeClass}">`;
    }).join('');

    if (images.length > 1) {
        let currentIndex = 0;
        const slideElements = slideshowLayer.querySelectorAll('.slide-image');
        const speed = (config.slideshow_speed || 5) * 1000;
        this._slideshowInterval = setInterval(() => {
            slideElements[currentIndex].classList.remove('active');
            currentIndex = (currentIndex + 1) % slideElements.length;
            slideElements[currentIndex].classList.add('active');
        }, speed);
    }
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    this.clearErrors();

    const container = element.querySelector("#container");
    const videoLayer = element.querySelector("#video-layer");
    const slideshowLayer = element.querySelector("#slideshow-layer");
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

    // --- VIDEO / GIF / IMAGE HANDLING ---
    const videoUrl = config.video_url;
    const targetOpacity = config.video_opacity || 0.15;

    videoLayer.style.opacity = targetOpacity;
    slideshowLayer.style.opacity = 0;

    if (this._slideshowInterval) clearInterval(this._slideshowInterval);

    if (!videoUrl) {
        this.startSlideshow(config, slideshowLayer, videoLayer);
    } else {
        const currentSrc = videoLayer.dataset.currentSrc;
        if (currentSrc !== videoUrl) {
            videoLayer.dataset.currentSrc = videoUrl;

            const isImage = /\.(gif|jpg|jpeg|png|webp)($|\?)/i.test(videoUrl) || /^data:image\//.test(videoUrl);

            if (isImage) {
                videoLayer.innerHTML = `
                    <img class="bg-content"
                         src="${videoUrl}"
                         onerror="this.parentElement.dispatchEvent(new CustomEvent('video-error', { bubbles: true }));">
                `;
            } else {
                videoLayer.innerHTML = `
                    <video class="bg-content"
                      autoplay muted loop playsinline preload="auto"
                      onerror="this.parentElement.dispatchEvent(new CustomEvent('video-error', { bubbles: true }));"
                      data-src="${videoUrl}">
                        <source src="${videoUrl}" type="video/mp4">
                    </video>`;
            }
        }
    }

    if (!videoLayer.dataset.errorListenerAttached) {
        videoLayer.addEventListener('video-error', () => {
            console.error("Media load failed. Falling back to slideshow.");
            this.startSlideshow(config, slideshowLayer, videoLayer);
        });
        videoLayer.dataset.errorListenerAttached = "true";
    }

    // --- Navigation Logic (Updated for 12 Fields) ---
    const activeTab = config.active_tab || "Dashboard";
    const target = config.menu_link_target || "_blank";

    let navHtml = "";

    // 12個のメニュー設定をループで確認
    for (let i = 1; i <= 12; i++) {
      const label = config[`menu_label_${i}`];
      const link = config[`menu_link_${i}`];

      // ラベルが入力されている場合のみ表示
      if (label && label.trim() !== "") {
        const cleanLabel = label.trim();
        const cleanLink = link ? link.trim() : "";

        const isActive = cleanLabel === activeTab;
        const activeClass = isActive ? "active" : "";
        const style = isActive ? `style="color: ${accentColor}; border-color: ${accentColor}"` : "";

        if (cleanLink) {
          navHtml += `<a href="${cleanLink}" class="nav-item ${activeClass}" ${style} target="${target}">${cleanLabel}</a>`;
        } else {
          navHtml += `<div class="nav-item ${activeClass}" ${style}>${cleanLabel}</div>`;
        }
      }
    }

    topNav.innerHTML = navHtml;

    brandTitle.innerHTML = config.brand_text || "THE LOOKER ARCHIVE";
    brandTitle.style.fontSize = `${config.brand_font_size || 72}px`;
    brandSubtitle.innerHTML = config.brand_subtitle || "D A T A  C O U T U R E";

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
               textValue = LookerCharts.Utils.textForCell(cell);
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

    done();
  }
});
