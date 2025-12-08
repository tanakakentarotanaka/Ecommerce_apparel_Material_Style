looker.plugins.visualizations.add({
  id: "custom-star-bar-list-v3",
  label: "Star Rating List Filter (Zero-Safe)",

  // ============================================================
  //  Configuration Options
  // ============================================================
  options: {
    // --- General Settings ---
    selection_mode: {
      label: "Selection Mode",
      type: "string",
      display: "select",
      values: [
        { "Multi-select": "multi" },
        { "Single-select": "single" }
      ],
      default: "multi",
      section: "General Settings",
      order: 1
    },
    title_override: {
      label: "Title Override",
      type: "string",
      default: "",
      section: "General Settings",
      order: 2
    },

    // --- Row Design ---
    header_row_design: {
      type: 'string',
      label: '--- Row (Card) Design ---',
      display: 'heading',
      section: 'Design',
      order: 5
    },
    row_bg_color: {
      label: "Row Background",
      type: "string",
      display: "color",
      default: "#ffffff",
      section: 'Design',
      order: 6
    },
    row_border_radius: {
      label: "Row Border Radius",
      type: "string",
      default: "4px",
      placeholder: "4px",
      section: 'Design',
      order: 7
    },
    row_spacing: {
      label: "Row Spacing (Gap)",
      type: "string",
      default: "2px",
      placeholder: "2px",
      section: 'Design',
      order: 8
    },
    row_padding: {
      label: "Row Padding",
      type: "string",
      default: "8px",
      placeholder: "8px",
      section: 'Design',
      order: 9
    },

    // --- Star Area Design ---
    header_star_settings: {
      type: 'string',
      label: '--- Star Area Design ---',
      display: 'heading',
      section: 'Design',
      order: 10
    },
    star_char: {
      label: "Star Character",
      type: "string",
      default: "★",
      section: 'Design',
      order: 11
    },
    star_color: {
      label: "Star Icon Color",
      type: "string",
      display: "color",
      default: "#f4c63d",
      section: 'Design',
      order: 12
    },
    dim_text_size: {
      label: "Font Size",
      type: "string",
      default: "14px",
      section: 'Design',
      order: 13
    },
    star_box_bg_color: {
      label: "Star Area Background",
      type: "string",
      display: "color",
      default: "transparent",
      section: 'Design',
      order: 14
    },
    star_box_radius: {
      label: "Star Area Radius",
      type: "string",
      default: "0px",
      placeholder: "4px",
      section: 'Design',
      order: 15
    },
    star_box_width: {
      label: "Star Area Width",
      type: "string",
      default: "60px",
      placeholder: "60px",
      section: 'Design',
      order: 16
    },

    // --- Bar Chart Settings ---
    header_bar_settings: {
      type: 'string',
      label: '--- Bar Chart Settings ---',
      display: 'heading',
      section: 'Design',
      order: 20
    },
    bar_color: {
      label: "Bar Color",
      type: "string",
      display: "color",
      default: "#a87676",
      section: 'Design',
      order: 21
    },
    bar_bg_color: {
      label: "Bar Background Color",
      type: "string",
      display: "color",
      default: "#f0f0f0",
      section: 'Design',
      order: 22
    },
    bar_height: {
      label: "Bar Height",
      type: "string",
      default: "8px",
      section: 'Design',
      order: 23
    },

    // --- Value & Percent Settings ---
    header_val_settings: {
      type: 'string',
      label: '--- Values & Percent ---',
      display: 'heading',
      section: 'Design',
      order: 30
    },
    show_percent: {
      label: "Show Percentage",
      type: "boolean",
      default: true,
      section: 'Design',
      order: 31
    },
    value_color: {
      label: "Value Color",
      type: "string",
      display: "color",
      default: "#333333",
      section: 'Design',
      order: 32
    },
    percent_color: {
      label: "Percent Color",
      type: "string",
      display: "color",
      default: "#888888",
      section: 'Design',
      order: 33
    },

    // --- Global Container Settings ---
    header_global: {
      type: 'string',
      label: '--- Global Container ---',
      display: 'heading',
      section: 'Design',
      order: 40
    },
    global_bg_color: {
      label: "Global Background",
      type: "string",
      display: "color",
      default: "#ffffff",
      section: 'Design',
      order: 41
    },
    global_border_radius: {
      label: "Container Radius",
      type: "string",
      default: "4px",
      section: 'Design',
      order: 42
    },

    // --- Row Interaction ---
    row_hover_color: {
      label: "Row Hover Color",
      type: "string",
      display: "color",
      default: "#f5f5f5",
      section: 'Design',
      order: 50
    },
    row_active_color: {
      label: "Row Selected Color",
      type: "string",
      display: "color",
      default: "#eef4ff",
      section: 'Design',
      order: 51
    }
  },

  create: function(element, config) {
    element.innerHTML = `
      <style>
        .cv-container {
          /* CSS Variables - updated via JS */
          --star-color: #f4c63d;
          --bar-color: #a87676;
          --bar-bg: #f0f0f0;
          --val-color: #333;
          --pct-color: #888;

          /* Row Styles */
          --row-bg: transparent;
          --row-radius: 4px;
          --row-spacing: 2px;
          --row-padding: 8px;
          --hover-bg: #f5f5f5;
          --active-bg: #eef4ff;

          /* Star Area Styles */
          --star-bg: transparent;
          --star-radius: 0px;
          --star-width: 60px;
          --dim-size: 14px;

          --bar-height: 8px;
          --container-radius: 4px;

          width: 100%;
          height: 100%;
          font-family: inherit;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          overflow: hidden;
          background-color: transparent;
          border-radius: var(--container-radius);
          padding: 8px;
        }

        .header-title {
            font-weight: 600;
            margin-bottom: 8px;
            font-size: 14px;
            color: #444;
            padding: 0 4px;
        }

        .scroll-area {
            flex: 1;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            /* gap is handled by margin-bottom for better browser support */
        }

        /* --- ROW STYLE --- */
        .row-item {
            display: flex;
            align-items: center;
            padding: var(--row-padding);
            margin-bottom: var(--row-spacing);
            cursor: pointer;
            border-radius: var(--row-radius);
            background-color: var(--row-bg);
            transition: background 0.1s;
            user-select: none;
        }

        .row-item:hover {
            background-color: var(--hover-bg);
        }
        .row-item.active {
            background-color: var(--active-bg);
            font-weight: 500;
        }

        /* --- STAR / LEFT AREA STYLE --- */
        .col-star {
            display: flex;
            align-items: center;
            justify-content: flex-start;
            width: var(--star-width);
            flex-shrink: 0;
            font-size: var(--dim-size);
            color: #333;

            background-color: var(--star-bg);
            border-radius: var(--star-radius);
            height: 100%;
            min-height: 24px;
            box-sizing: border-box;
            padding-left: 4px;
        }
        .star-icon {
            color: var(--star-color);
            margin-right: 6px;
            font-size: 1.1em;
        }

        /* --- BAR AREA --- */
        .col-bar {
            flex: 1;
            margin: 0 12px;
            display: flex;
            align-items: center;
        }
        .bar-track {
            width: 100%;
            height: var(--bar-height);
            background-color: var(--bar-bg);
            border-radius: 10px;
            overflow: hidden;
        }
        .bar-fill {
            height: 100%;
            background-color: var(--bar-color);
            border-radius: 10px;
            width: 0%;
            transition: width 0.5s ease;
        }

        /* --- VALUES AREA --- */
        .col-val {
            text-align: right;
            min-width: 80px;
            flex-shrink: 0;
            display: flex;
            align-items: baseline;
            justify-content: flex-end;
            gap: 6px;
        }
        .val-num {
            color: var(--val-color);
            font-weight: 600;
            font-size: 14px;
        }
        .val-pct {
            color: var(--pct-color);
            font-size: 12px;
        }

        .viz-error {
            color: #c00;
            padding: 10px;
            background: #ffebeb;
            border-radius: 4px;
            font-size: 12px;
        }
      </style>
      <div id="viz-root" class="cv-container"></div>
    `;
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    const root = element.querySelector("#viz-root");

    // --- Error Handling ---
    if (!queryResponse || !queryResponse.fields || !data) {
        if (done) done(); return;
    }
    const dims = queryResponse.fields.dimensions;
    const measures = queryResponse.fields.measures;

    if (!dims || dims.length === 0) {
        root.innerHTML = `<div class="viz-error">Dimension required.</div>`;
        if (done) done(); return;
    }
    if (!measures || measures.length === 0) {
         root.innerHTML = `<div class="viz-error">Measure required.</div>`;
        if (done) done(); return;
    }

    const dimName = dims[0].name;
    const measureName = measures[0].name;

    // --- Helper Functions ---
    const fixPx = (val, defaultVal) => {
      if (!val) return defaultVal;
      if (typeof val === 'number' || (typeof val === 'string' && /^\d+$/.test(val.trim()))) {
        return val + "px";
      }
      return val;
    };

    const setVar = (name, val) => root.style.setProperty(name, val);

    // --- Apply Styles ---
    setVar('--star-color', config.star_color || '#f4c63d');
    setVar('--bar-color', config.bar_color || '#a87676');
    setVar('--bar-bg', config.bar_bg_color || '#f0f0f0');
    setVar('--val-color', config.value_color || '#333');
    setVar('--pct-color', config.percent_color || '#888');
    setVar('--container-radius', fixPx(config.global_border_radius, '4px'));
    if(config.global_bg_color) {
        root.style.backgroundColor = config.global_bg_color;
    }

    setVar('--row-bg', config.row_bg_color || 'transparent');
    setVar('--row-radius', fixPx(config.row_border_radius, '4px'));
    setVar('--row-spacing', fixPx(config.row_spacing, '2px'));
    setVar('--row-padding', fixPx(config.row_padding, '8px'));
    setVar('--hover-bg', config.row_hover_color || '#f5f5f5');
    setVar('--active-bg', config.row_active_color || '#eef4ff');

    setVar('--star-bg', config.star_box_bg_color || 'transparent');
    setVar('--star-radius', fixPx(config.star_box_radius, '0px'));
    setVar('--star-width', fixPx(config.star_box_width, '60px'));
    setVar('--dim-size', fixPx(config.dim_text_size, '14px'));
    setVar('--bar-height', fixPx(config.bar_height, '8px'));

    // --- Data Calculation ---
    let totalValue = 0;
    let maxValue = 0;
    data.forEach(row => {
        let val = row[measureName].value;
        // Treat null or undefined as 0 for calculation
        if (val === null || val === undefined) val = 0;

        if (typeof val === 'number') {
            totalValue += val;
            if (val > maxValue) maxValue = val;
        }
    });
    if (totalValue === 0) totalValue = 1;
    if (maxValue === 0) maxValue = 1;

    // --- Render ---
    root.innerHTML = "";

    // Title
    const titleText = config.title_override || dims[0].label_short || dims[0].label;
    if (titleText) {
        const titleDiv = document.createElement("div");
        titleDiv.className = "header-title";
        titleDiv.innerText = titleText;
        root.appendChild(titleDiv);
    }

    const scrollArea = document.createElement("div");
    scrollArea.className = "scroll-area";
    root.appendChild(scrollArea);

    const starChar = config.star_char || "★";
    const crossfilterEnabled = details.crossfilterEnabled;

    data.forEach(row => {
        const dimVal = row[dimName].value;
        const dimLabel = LookerCharts.Utils.htmlForCell(row[dimName]);

        // ★ Robust 0 Handling
        let rawVal = row[measureName].value;
        if (rawVal === null || rawVal === undefined) rawVal = 0;
        const measureVal = rawVal;

        let measureRendered = row[measureName].rendered;
        // If rendered is empty but value is 0, show "0" string
        if ((!measureRendered || measureRendered === "") && measureVal === 0) {
            measureRendered = "0";
        } else if (!measureRendered) {
            measureRendered = measureVal.toLocaleString();
        }

        const percent = (measureVal / totalValue) * 100;
        const barWidth = (measureVal / maxValue) * 100;

        // Crossfilter Logic
        let isSelected = false;
        if (crossfilterEnabled) {
             const state = LookerCharts.Utils.getCrossfilterSelection(row, null);
             isSelected = (state === 1);
        }

        // --- Row ---
        const rowDiv = document.createElement("div");
        rowDiv.className = "row-item";
        if (isSelected) rowDiv.classList.add("active");

        rowDiv.onclick = (event) => {
             if (!crossfilterEnabled) return;
             let eventToPass = {
                target: event.target, currentTarget: event.currentTarget,
                metaKey: true, ctrlKey: true, shiftKey: event.shiftKey, altKey: event.altKey,
                type: 'click', preventDefault: () => {}, stopPropagation: () => {}
             };
             LookerCharts.Utils.toggleCrossfilter({ row: row, pivot: null, event: eventToPass });
        };

        // 1. Star Area
        const colStar = document.createElement("div");
        colStar.className = "col-star";
        colStar.innerHTML = `<span class="star-icon">${starChar}</span> <span>${dimLabel}</span>`;
        rowDiv.appendChild(colStar);

        // 2. Bar Chart
        const colBar = document.createElement("div");
        colBar.className = "col-bar";
        colBar.innerHTML = `<div class="bar-track"><div class="bar-fill" style="width: ${barWidth}%;"></div></div>`;
        rowDiv.appendChild(colBar);

        // 3. Values
        const colVal = document.createElement("div");
        colVal.className = "col-val";

        const valSpan = document.createElement("span");
        valSpan.className = "val-num";
        valSpan.innerText = measureRendered;
        colVal.appendChild(valSpan);

        if (config.show_percent) {
            const pctSpan = document.createElement("span");
            pctSpan.className = "val-pct";
            pctSpan.innerText = `(${percent.toFixed(1)}%)`;
            colVal.appendChild(pctSpan);
        }

        rowDiv.appendChild(colVal);
        scrollArea.appendChild(rowDiv);
    });

    if (done) done();
  }
});
