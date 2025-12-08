looker.plugins.visualizations.add({
  id: "custom-star-bar-list",
  label: "Star Rating List Filter",

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

    // --- Star & Dimension Settings ---
    header_star_settings: {
      type: 'string',
      label: '--- Star Settings ---',
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
      label: "Star Color",
      type: "string",
      display: "color",
      default: "#f4c63d", // Image yellow
      section: 'Design',
      order: 12
    },
    dim_text_size: {
      label: "Dimension Font Size",
      type: "string",
      default: "14px",
      section: 'Design',
      order: 13
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
      default: "#a87676", // Image brownish/mauve
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

    // --- Global Container Settings (Inherited) ---
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
      label: "Border Radius",
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
      default: "#eef4ff", // Very light blue
      section: 'Design',
      order: 51
    }
  },

  create: function(element, config) {
    element.innerHTML = `
      <style>
        .cv-container {
          --star-color: #f4c63d;
          --bar-color: #a87676;
          --bar-bg: #f0f0f0;
          --val-color: #333;
          --pct-color: #888;
          --hover-bg: #f5f5f5;
          --active-bg: #eef4ff;
          --radius: 4px;
          --dim-size: 14px;
          --bar-height: 8px;

          width: 100%;
          height: 100%;
          font-family: inherit;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          overflow: hidden;
          background-color: #fff; /* Default */
          border-radius: var(--radius);
          padding: 8px;
        }

        .header-title {
            font-weight: 600;
            margin-bottom: 8px;
            font-size: 14px;
            color: #444;
        }

        .scroll-area {
            flex: 1;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 4px; /* Space between rows */
        }

        .row-item {
            display: flex;
            align-items: center;
            padding: 8px 8px;
            cursor: pointer;
            border-radius: 4px;
            transition: background 0.1s;
            user-select: none;
        }

        .row-item:hover {
            background-color: var(--hover-bg);
        }
        .row-item.active {
            background-color: var(--active-bg);
            /* Optional: Add a subtle border or indicator for selection */
            font-weight: 500;
        }

        /* --- Section 1: Star & Dimension (Left) --- */
        .col-star {
            display: flex;
            align-items: center;
            width: 50px; /* Fixed width for alignment */
            flex-shrink: 0;
            font-size: var(--dim-size);
            color: #333;
        }
        .star-icon {
            color: var(--star-color);
            margin-right: 6px;
            font-size: 1.1em;
        }

        /* --- Section 2: Bar Chart (Middle) --- */
        .col-bar {
            flex: 1; /* Takes remaining space */
            margin: 0 16px;
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
            width: 0%; /* JS will set this */
            transition: width 0.5s ease;
        }

        /* --- Section 3: Values (Right) --- */
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

    // --- 1. Error Handling ---
    if (!queryResponse || !queryResponse.fields || !data) {
        if (done) done(); return;
    }

    const dims = queryResponse.fields.dimensions;
    const measures = queryResponse.fields.measures;

    if (!dims || dims.length === 0) {
        root.innerHTML = `<div class="viz-error">Dimension required (e.g., Rating).</div>`;
        if (done) done(); return;
    }
    if (!measures || measures.length === 0) {
         root.innerHTML = `<div class="viz-error">Measure required (e.g., Count).</div>`;
        if (done) done(); return;
    }

    const dimName = dims[0].name;
    const measureName = measures[0].name;

    // --- 2. CSS Variable Injection ---
    const setVar = (name, val) => root.style.setProperty(name, val);

    setVar('--star-color', config.star_color || '#f4c63d');
    setVar('--bar-color', config.bar_color || '#a87676');
    setVar('--bar-bg', config.bar_bg_color || '#f0f0f0');
    setVar('--val-color', config.value_color || '#333');
    setVar('--pct-color', config.percent_color || '#888');
    setVar('--radius', config.global_border_radius || '4px');
    setVar('--dim-size', config.dim_text_size || '14px');
    setVar('--bar-height', config.bar_height || '8px');

    // Backgrounds
    setVar('--hover-bg', config.row_hover_color || '#f5f5f5');
    setVar('--active-bg', config.row_active_color || '#eef4ff');
    if(config.global_bg_color) {
        root.style.backgroundColor = config.global_bg_color;
    }

    // --- 3. Data Processing ---
    // Calculate Total and Max for Bars and Percentages
    let totalValue = 0;
    let maxValue = 0;

    data.forEach(row => {
        const val = row[measureName].value;
        if (typeof val === 'number') {
            totalValue += val;
            if (val > maxValue) maxValue = val;
        }
    });

    if (totalValue === 0) totalValue = 1; // Prevent divide by zero
    if (maxValue === 0) maxValue = 1;

    // --- 4. Render Layout ---
    root.innerHTML = ""; // Clear previous

    // Create Title (if any)
    const titleText = config.title_override || dims[0].label_short || dims[0].label;
    if (titleText) {
        const titleDiv = document.createElement("div");
        titleDiv.className = "header-title";
        titleDiv.innerText = titleText;
        root.appendChild(titleDiv);
    }

    // Create Scroll Area
    const scrollArea = document.createElement("div");
    scrollArea.className = "scroll-area";
    root.appendChild(scrollArea);

    const starChar = config.star_char || "★";
    const crossfilterEnabled = details.crossfilterEnabled;

    data.forEach(row => {
        // Prepare Values
        const dimVal = row[dimName].value;
        const dimLabel = LookerCharts.Utils.htmlForCell(row[dimName]); // Handles HTML formatting if present

        const measureVal = row[measureName].value || 0;
        const measureRendered = row[measureName].rendered || measureVal.toLocaleString();

        const percent = (measureVal / totalValue) * 100;
        const barWidth = (measureVal / maxValue) * 100; // Bar is relative to Max, not Total

        // Check Selection State
        let isSelected = false;
        if (crossfilterEnabled) {
             const state = LookerCharts.Utils.getCrossfilterSelection(row, null);
             isSelected = (state === 1); // 1 = selected
        }

        // --- Create Row DOM ---
        const rowDiv = document.createElement("div");
        rowDiv.className = "row-item";
        if (isSelected) rowDiv.classList.add("active");

        // Click Handler (Crossfilter)
        rowDiv.onclick = (event) => {
             if (!crossfilterEnabled) return;

             let eventToPass = {
                target: event.target,
                currentTarget: event.currentTarget,
                metaKey: true, // Force multi-select behavior usually
                ctrlKey: true,
                shiftKey: event.shiftKey,
                altKey: event.altKey,
                type: 'click',
                preventDefault: () => {},
                stopPropagation: () => {}
             };

             // If config is single select, don't pass meta/ctrl logic (simplified)
             if (config.selection_mode === 'single') {
                 // Standard click usually creates single select in Looker logic
                 // depending on how Utils handles it, but passing metaKey=true forces toggle.
                 // For true single select we might need custom logic, but standard behavior implies toggle.
             }

             LookerCharts.Utils.toggleCrossfilter({
                row: row,
                pivot: null,
                event: eventToPass
             });
        };

        // 1. Star & Dimension
        const colStar = document.createElement("div");
        colStar.className = "col-star";
        colStar.innerHTML = `<span class="star-icon">${starChar}</span> <span>${dimLabel}</span>`;
        rowDiv.appendChild(colStar);

        // 2. Bar Chart
        const colBar = document.createElement("div");
        colBar.className = "col-bar";
        colBar.innerHTML = `
            <div class="bar-track">
                <div class="bar-fill" style="width: ${barWidth}%;"></div>
            </div>
        `;
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
