looker.plugins.visualizations.add({
  id: "custom-star-list-merged",
  label: "Star Rating List & Bar (Merged)",

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
        { "Multi-select (Checkbox)": "multi" },
        { "Single-select (Radio)": "single" }
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

    // --- Star Settings (New) ---
    header_star_settings: {
      type: 'string',
      label: '--- Star Settings ---',
      display: 'heading',
      section: 'Design',
      order: 5
    },
    star_char: {
      label: "Star Character",
      type: "string",
      default: "★",
      section: 'Design',
      order: 6
    },
    star_color: {
      label: "Star Color",
      type: "string",
      display: "color",
      default: "#f4c63d",
      section: 'Design',
      order: 7
    },

    // --- List Item Settings (Restored from Original) ---
    header_design_list: {
      type: 'string',
      label: '--- List Items (Original) ---',
      display: 'heading',
      section: 'Design',
      order: 32
    },
    list_font_size: {
      label: "Font Size",
      type: "string",
      default: "13",
      display_size: 'half',
      placeholder: "13",
      section: 'Design',
      order: 34
    },
    list_text_color: {
      label: "Text Color",
      type: "string",
      display: "color",
      display_size: 'half',
      default: "#333333",
      section: 'Design',
      order: 35
    },
    checkbox_opacity: {
      label: "Checkbox Opacity (%)", // 0にすればチェックボックスを隠せます
      type: "number",
      display_size: 'half',
      default: 100,
      min: 0, max: 100,
      section: 'Design',
      order: 39
    },
    checkbox_color: {
      label: "Checked Color",
      type: "string",
      display: "color",
      display_size: 'half',
      default: "#1967d2",
      section: 'Design',
      order: 40
    },
    checkbox_unchecked_border: {
      label: "Unchecked Border",
      type: "string",
      display: "color",
      display_size: 'third',
      default: "#999999",
      section: 'Design',
      order: 41
    },
    checkbox_unchecked_bg: {
      label: "Unchecked Bg",
      type: "string",
      display: "color",
      display_size: 'third',
      default: "#ffffff",
      section: 'Design',
      order: 42
    },

    // --- Row Interaction Settings (Restored from Original) ---
    header_design_row: {
      type: 'string',
      label: '--- Row Interaction ---',
      display: 'heading',
      section: 'Design',
      order: 50
    },
    row_hover_color: {
      label: "Hover Background",
      type: "string",
      display: "color",
      display_size: 'half',
      default: "#f1f3f4",
      section: 'Design',
      order: 52
    },
    row_active_bg_color: {
      label: "Selected Bg",
      type: "string",
      display: "color",
      display_size: 'third',
      default: "#e8f0fe",
      section: 'Design',
      order: 55
    },
    row_active_text_color: {
      label: "Selected Text",
      type: "string",
      display: "color",
      display_size: 'third',
      default: "#1967d2",
      section: 'Design',
      order: 54
    },

    // --- Bar Chart & Values Settings (New) ---
    header_bar_settings: {
      type: 'string',
      label: '--- Bar Chart & Values ---',
      display: 'heading',
      section: 'Design',
      order: 60
    },
    bar_color: {
      label: "Bar Color",
      type: "string",
      display: "color",
      default: "#a87676",
      section: 'Design',
      order: 61
    },
    bar_bg_color: {
      label: "Bar Background",
      type: "string",
      display: "color",
      default: "#f0f0f0",
      section: 'Design',
      order: 62
    },
    bar_height: {
      label: "Bar Height",
      type: "string",
      default: "8px",
      section: 'Design',
      order: 63
    },
    show_percent: {
      label: "Show Percentage",
      type: "boolean",
      default: true,
      section: 'Design',
      order: 64
    },
    value_color: {
      label: "Value Color",
      type: "string",
      display: "color",
      default: "#333333",
      section: 'Design',
      order: 65
    },
    percent_color: {
      label: "Percent Color",
      type: "string",
      display: "color",
      default: "#888888",
      section: 'Design',
      order: 66
    },

    // --- Global Container (Restored) ---
    header_global: {
      type: 'string',
      label: '--- Global Settings ---',
      display: 'heading',
      section: 'Design',
      order: 70
    },
    global_bg_color: {
      label: "Global Background",
      type: "string",
      display: "color",
      default: "#ffffff",
      section: 'Design',
      order: 71
    },
    global_border_radius: {
      label: "Container Radius",
      type: "string",
      default: "4px",
      section: 'Design',
      order: 72
    },
  },

  create: function(element, config) {
    element.innerHTML = `
      <style>
        .cv-container {
          /* CSS Variables - Injected via JS */
          --global-bg: #fff;
          --global-radius: 4px;

          --list-font-size: 13px;
          --list-text-color: #333;

          --checkbox-opacity: 1;
          --checkbox-color: #1967d2;
          --checkbox-unchecked-border: #999;
          --checkbox-unchecked-bg: #fff;

          --row-hover-bg: #f1f3f4;
          --row-active-bg: #e8f0fe;
          --row-active-text: #1967d2;

          --star-color: #f4c63d;

          --bar-color: #a87676;
          --bar-bg: #f0f0f0;
          --bar-height: 8px;
          --val-color: #333;
          --pct-color: #888;

          width: 100%;
          height: 100%;
          font-family: inherit;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          overflow: hidden;
          background-color: var(--global-bg);
          border-radius: var(--global-radius);
          padding: 8px;
        }

        .header-title {
            font-weight: 600;
            margin-bottom: 6px;
            font-size: 14px;
            color: #444;
            flex-shrink: 0;
        }

        .scroll-area {
            flex: 1;
            overflow-y: auto;
            border: 1px solid transparent; /* Placeholder to match original structure */
            display: flex;
            flex-direction: column;
        }

        /* --- Original List Item Styles (Restored) --- */
        .item-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 8px;
          cursor: pointer;
          font-size: var(--list-font-size);
          color: var(--list-text-color);
          user-select: none;
          border-radius: 4px;
          transition: background-color 0.1s;
          margin-bottom: 1px;
          line-height: 1.4;
        }
        .item-row:hover { background-color: var(--row-hover-bg); }
        .item-row.active {
          background-color: var(--row-active-bg);
          color: var(--row-active-text);
          font-weight: 500;
        }

        /* Left Side: Checkbox + Star + Label */
        .item-left {
          display: flex;
          align-items: center;
          overflow: hidden;
          flex: 0 0 auto; /* Do not shrink/grow freely */
          min-width: 80px; /* Ensure space for star + text */
          margin-right: 12px;
          position: relative;
        }

        /* Custom Checkbox Implementation */
        .item-left input {
          position: absolute;
          opacity: 0;
          cursor: pointer;
          height: 100%;
          width: 100%;
          left: 0; top: 0;
          margin: 0;
          z-index: 3;
        }

        .checkmark {
          height: 16px;
          width: 16px;
          background-color: var(--checkbox-unchecked-bg);
          border: 2px solid var(--checkbox-unchecked-border);
          margin-right: 8px;
          flex-shrink: 0;
          position: relative;
          z-index: 1;
          box-sizing: border-box;
          border-radius: 3px; /* Default for checkbox */
          opacity: var(--checkbox-opacity);
        }

        /* Radio Style Circle */
        .item-left.is-radio .checkmark {
            border-radius: 50%;
        }

        .item-left input:checked ~ .checkmark {
          background-color: var(--checkbox-color) !important;
          border-color: var(--checkbox-color) !important;
        }

        .checkmark:after {
          content: "";
          position: absolute;
          display: none;
        }
        .item-left input:checked ~ .checkmark:after { display: block; }

        /* Checkbox Tick */
        .item-left input ~ .checkmark:after {
          left: 4px; top: 0px;
          width: 4px; height: 9px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }
        /* Radio Dot */
        .item-left.is-radio input ~ .checkmark:after {
          left: 3px; top: 3px;
          width: 6px; height: 6px;
          border-radius: 50%;
          background: white;
          border: none;
          transform: none;
        }

        .label-text {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            z-index: 2;
            display: flex;
            align-items: center;
        }

        .star-icon {
            color: var(--star-color);
            margin-right: 4px;
            font-size: 1.1em;
        }

        /* --- Right Side: Bar Chart + Values --- */
        .item-right {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            min-width: 0; /* Allow flex shrink */
            gap: 12px;
        }

        .bar-container {
            flex: 1;
            height: var(--bar-height);
            background-color: var(--bar-bg);
            border-radius: 10px;
            overflow: hidden;
            margin-right: 8px;
            min-width: 40px; /* Minimum bar area width */
        }
        .bar-fill {
            height: 100%;
            background-color: var(--bar-color);
            border-radius: 10px;
            width: 0%;
            transition: width 0.5s ease;
        }

        .values-container {
            text-align: right;
            flex-shrink: 0;
            display: flex;
            align-items: baseline;
            justify-content: flex-end;
            gap: 6px;
            min-width: 60px;
        }
        .val-num {
            color: var(--val-color);
            font-weight: 600;
        }
        .val-pct {
            color: var(--pct-color);
            font-size: 0.9em;
        }

        .viz-error { color: #c00; padding: 10px; background: #ffebeb; border-radius: 4px; font-size: 12px; }
      </style>
      <div id="viz-root" class="cv-container"></div>
    `;
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    const root = element.querySelector("#viz-root");

    // --- Helper to fix px units ---
    const fixPx = (val, defaultVal) => {
        if (!val) return defaultVal;
        if (typeof val === 'number' || (typeof val === 'string' && /^\d+$/.test(val.trim()))) {
            return val + "px";
        }
        return val;
    };

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
    const dimName = dims[0].name;
    const measureName = measures && measures.length > 0 ? measures[0].name : null;

    // --- Apply CSS Variables ---
    const setVar = (name, val) => root.style.setProperty(name, val);

    setVar('--global-bg', config.global_bg_color || '#fff');
    setVar('--global-radius', fixPx(config.global_border_radius, '4px'));

    setVar('--list-font-size', fixPx(config.list_font_size, '13px'));
    setVar('--list-text-color', config.list_text_color || '#333');

    setVar('--checkbox-opacity', (config.checkbox_opacity !== undefined ? config.checkbox_opacity : 100) / 100);
    setVar('--checkbox-color', config.checkbox_color || '#1967d2');
    setVar('--checkbox-unchecked-border', config.checkbox_unchecked_border || '#999');
    setVar('--checkbox-unchecked-bg', config.checkbox_unchecked_bg || '#fff');

    setVar('--row-hover-bg', config.row_hover_color || '#f1f3f4');
    setVar('--row-active-bg', config.row_active_bg_color || '#e8f0fe');
    setVar('--row-active-text', config.row_active_text_color || '#1967d2');

    setVar('--star-color', config.star_color || '#f4c63d');
    setVar('--bar-color', config.bar_color || '#a87676');
    setVar('--bar-bg', config.bar_bg_color || '#f0f0f0');
    setVar('--bar-height', fixPx(config.bar_height, '8px'));
    setVar('--val-color', config.value_color || '#333');
    setVar('--pct-color', config.percent_color || '#888');

    // --- Data Calculation ---
    let totalValue = 0;
    let maxValue = 0;
    if (measureName) {
        data.forEach(row => {
            const val = row[measureName].value;
            if (typeof val === 'number') {
                totalValue += val;
                if (val > maxValue) maxValue = val;
            }
        });
    }
    if (totalValue === 0) totalValue = 1;
    if (maxValue === 0) maxValue = 1;

    // --- Render ---
    root.innerHTML = ""; // Clear

    // Title
    const titleText = config.title_override || dims[0].label_short || dims[0].label;
    if (titleText) {
        const titleDiv = document.createElement("div");
        titleDiv.className = "header-title";
        titleDiv.innerText = titleText;
        root.appendChild(titleDiv);
    }

    // Scroll Area
    const scrollArea = document.createElement("div");
    scrollArea.className = "scroll-area";
    root.appendChild(scrollArea);

    const selectionMode = config.selection_mode || "multi";
    const inputType = selectionMode === "multi" ? "checkbox" : "radio";
    const starChar = config.star_char || "★";
    const crossfilterEnabled = details.crossfilterEnabled;

    data.forEach(row => {
        const dimVal = row[dimName].value;
        const dimLabel = LookerCharts.Utils.htmlForCell(row[dimName]);

        let measureVal = 0;
        let measureRendered = "";
        let percent = 0;
        let barWidth = 0;

        if (measureName) {
            measureVal = row[measureName].value || 0;
            measureRendered = row[measureName].rendered || measureVal.toLocaleString();
            percent = (measureVal / totalValue) * 100;
            barWidth = (measureVal / maxValue) * 100;
        }

        // Selection State
        let isSelected = false;
        if (crossfilterEnabled) {
             const state = LookerCharts.Utils.getCrossfilterSelection(row, null);
             isSelected = (state === 1);
        }

        // Create Row
        const rowDiv = document.createElement("div");
        rowDiv.className = "item-row";
        if (isSelected) rowDiv.classList.add("active");

        // --- Left Side (Checkbox + Star + Text) ---
        const leftDiv = document.createElement("div");
        leftDiv.className = "item-left";
        if (inputType === 'radio') leftDiv.classList.add('is-radio');

        // Hidden Input for logic
        const input = document.createElement("input");
        input.type = inputType;
        input.checked = isSelected;
        input.name = "viz_filter_group"; // needed for radio grouping

        // Custom Checkmark Span
        const checkmark = document.createElement("span");
        checkmark.className = "checkmark";

        // Label Text (Star + Value)
        const labelSpan = document.createElement("span");
        labelSpan.className = "label-text";
        labelSpan.innerHTML = `<span class="star-icon">${starChar}</span> ${dimLabel}`;

        leftDiv.appendChild(input);
        leftDiv.appendChild(checkmark);
        leftDiv.appendChild(labelSpan);
        rowDiv.appendChild(leftDiv);

        // --- Right Side (Bar + Values) ---
        const rightDiv = document.createElement("div");
        rightDiv.className = "item-right";

        if (measureName) {
            // Bar
            const barContainer = document.createElement("div");
            barContainer.className = "bar-container";
            const barFill = document.createElement("div");
            barFill.className = "bar-fill";
            barFill.style.width = `${barWidth}%`;
            barContainer.appendChild(barFill);

            // Values
            const valContainer = document.createElement("div");
            valContainer.className = "values-container";

            const numSpan = document.createElement("span");
            numSpan.className = "val-num";
            numSpan.innerText = measureRendered;
            valContainer.appendChild(numSpan);

            if (config.show_percent) {
                const pctSpan = document.createElement("span");
                pctSpan.className = "val-pct";
                pctSpan.innerText = `(${percent.toFixed(1)}%)`;
                valContainer.appendChild(pctSpan);
            }

            rightDiv.appendChild(barContainer);
            rightDiv.appendChild(valContainer);
        }

        rowDiv.appendChild(rightDiv);

        // Click Event (Original List Logic)
        rowDiv.onclick = (event) => {
             if (!crossfilterEnabled) return;

             // Prevent default if clicking directly on input to avoid double toggle
             if (event.target.tagName === 'INPUT') return;

             let eventToPass = {
                target: event.target,
                currentTarget: event.currentTarget,
                metaKey: true, // Force toggle behavior usually preferred for filters
                ctrlKey: true,
                shiftKey: event.shiftKey,
                altKey: event.altKey,
                type: 'click',
                preventDefault: () => {},
                stopPropagation: () => {}
             };

             LookerCharts.Utils.toggleCrossfilter({
                row: row,
                pivot: null,
                event: eventToPass
             });
        };

        // Sync input click
        input.onclick = (e) => {
            // Let the row click handler deal with Looker logic,
            // but we need to stop propagation if we don't want the row handler to fire twice.
            // Actually simpler to just trigger the row click logic visually.
            // Looker's toggleCrossfilter handles the data update which re-renders the chart.
        };

        scrollArea.appendChild(rowDiv);
    });

    if (done) done();
  }
});
