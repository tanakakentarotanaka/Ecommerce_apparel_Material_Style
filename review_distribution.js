looker.plugins.visualizations.add({
  id: "fashion-runway-list",
  label: "Rose Quartz Product List",

  // ============================================================
  //  Configuration Options
  // ============================================================
  options: {
    // --- Data Mapping ---
    image_field: {
      label: "Image URL Field",
      type: "string",
      display: "select",
      section: "Data Mapping",
      order: 1,
      values: [{ "First String Dimension": "" }]
    },
    price_field: {
      label: "Price Field",
      type: "string",
      display: "select",
      section: "Data Mapping",
      order: 2,
      values: [{ "First Measure": "" }]
    },
    status_field: {
      label: "Status Field (Stock)",
      type: "string",
      display: "select",
      section: "Data Mapping",
      order: 3,
      values: [{ "None": "" }]
    },

    // --- Design Settings (Preserved & Enhanced) ---
    header_design_global: {
      type: 'string',
      label: '--- Design Settings ---',
      display: 'heading',
      section: 'Design',
      order: 10
    },
    global_border_radius: {
      label: "Border Radius",
      type: "string",
      display: "text",
      default: "12px", // Matching the soft UI
      section: 'Design',
      order: 11
    },
    row_hover_color: {
      label: "Hover Color",
      type: "string",
      display: "color",
      default: "#fcf8f8", // Soft rose hint
      section: 'Design',
      order: 12
    },
    selection_color: {
        label: "Selection Accent",
        type: "string",
        display: "color",
        default: "#AA7777", // Rose Quartz Dark
        section: 'Design',
        order: 13
    }
  },

  // ============================================================
  //  Create
  // ============================================================
  create: function(element, config) {
    element.innerHTML = `
      <style>
        .runway-container {
          width: 100%;
          height: 100%;
          overflow-y: auto;
          font-family: 'Inter', sans-serif;
          background-color: transparent;
          padding: 8px;
          box-sizing: border-box;
        }

        /* Scrollbar styling for elegance */
        .runway-container::-webkit-scrollbar { width: 6px; }
        .runway-container::-webkit-scrollbar-track { background: transparent; }
        .runway-container::-webkit-scrollbar-thumb { background-color: #e0e0e0; border-radius: 10px; }

        .product-row {
          display: grid;
          /* Image | Info | Price | Stock | Trend */
          grid-template-columns: 60px 2fr 1fr 1fr 1fr;
          gap: 16px;
          align-items: center;
          background: #ffffff;
          margin-bottom: 12px;
          padding: 12px;
          border-radius: var(--radius);
          transition: all 0.2s ease;
          cursor: pointer;
          border: 1px solid transparent;
          box-shadow: 0 2px 5px rgba(0,0,0,0.03);
        }

        .product-row:hover {
          background-color: var(--hover-bg);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(170, 119, 119, 0.15);
        }

        .product-row.active {
          border: 1px solid var(--select-color);
          background-color: #faf3f3;
        }

        /* Image */
        .prod-img {
          width: 50px;
          height: 60px;
          object-fit: cover;
          border-radius: 4px;
          background-color: #eee;
        }

        /* Info Section */
        .prod-info { display: flex; flex-direction: column; justify-content: center; }
        .prod-title { font-weight: 600; color: #333; font-size: 14px; margin-bottom: 4px; }
        .prod-meta { display: flex; gap: 8px; align-items: center; }
        .stars { color: #d4a5a5; font-size: 12px; letter-spacing: 1px; }
        .add-btn {
            font-size: 10px; padding: 4px 8px; background: #eadcdb;
            color: #5d4037; border-radius: 12px; border: none; font-weight: 600;
        }

        /* Price */
        .prod-price { font-weight: 600; color: #333; font-size: 14px; text-align: right;}

        /* Stock Pill */
        .stock-pill {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          text-align: center;
          font-weight: 500;
          width: fit-content;
          justify-self: center;
        }
        .stock-in { background-color: #e6f4ea; color: #1e8e3e; }
        .stock-low { background-color: #fce8e6; color: #c5221f; }

        /* Sparkline SVG */
        .sparkline { width: 100%; height: 30px; stroke: #AA7777; fill: none; stroke-width: 2px; }

        .error-msg { color: #AA7777; padding: 20px; font-style: italic; }
      </style>
      <div id="viz-root" class="runway-container"></div>
    `;
  },

  // ============================================================
  //  UpdateAsync
  // ============================================================
  updateAsync: function(data, element, config, queryResponse, details, done) {
    const root = element.querySelector("#viz-root");
    root.innerHTML = ""; // Clear previous

    // Error Handling
    if (!data || data.length === 0) {
        root.innerHTML = "<div class='error-msg'>No data found. Please add dimensions.</div>";
        done(); return;
    }

    // --- Options Registration (Dynamic Fields) ---
    const dimensions = queryResponse.fields.dimensions || [];
    const measures = queryResponse.fields.measures || [];

    // Create dropdown values for settings
    const dimOptions = dimensions.map(d => ({ [d.label]: d.name }));
    const measOptions = measures.map(m => ({ [m.label]: m.name }));

    // Only update options if they differ to avoid loop
    if (!config.image_field || config.image_field === "") {
        this.trigger('registerOptions', {
            ...this.options,
            image_field: { ...this.options.image_field, values: dimOptions },
            price_field: { ...this.options.price_field, values: measOptions },
            status_field: { ...this.options.status_field, values: dimOptions }
        });
    }

    // --- CSS Variables Assignment ---
    root.style.setProperty('--radius', config.global_border_radius || '12px');
    root.style.setProperty('--hover-bg', config.row_hover_color || '#fcf8f8');
    root.style.setProperty('--select-color', config.selection_color || '#AA7777');

    // --- Data Parsing ---
    // Primary key is usually the first dimension for filtering
    const filterDim = dimensions[0].name;
    const imgDim = config.image_field || (dimensions[1] ? dimensions[1].name : dimensions[0].name);
    const titleDim = dimensions[0].name; // Assuming 1st dim is Name
    const priceMeas = config.price_field || (measures[0] ? measures[0].name : null);
    const statusDim = config.status_field || null;

    data.forEach(row => {
        // Retrieve values
        const title = LookerCharts.Utils.textForCell(row[titleDim]);
        const imgUrl = row[imgDim] ? row[imgDim].value : '';
        // If image URL is not a valid URL (e.g. "Silky Blouse"), use a placeholder or handle gracefully
        const safeImg = (imgUrl && imgUrl.includes('http')) ? imgUrl : 'https://via.placeholder.com/50x60/eadcdb/AA7777?text=No+Img';

        const price = priceMeas ? LookerCharts.Utils.textForCell(row[priceMeas]) : '-';
        const status = statusDim ? LookerCharts.Utils.textForCell(row[statusDim]) : 'Stock';

        // Stock logic for coloring
        const stockClass = (status.toLowerCase().includes('stock')) ? 'stock-in' : 'stock-low';

        // Fake Sparkline Generation (Purely Visual for the demo, unless real trend data is provided)
        // In a real scenario, you would parse an array of numbers here.
        const points = Array.from({length: 8}, (_, i) => `${i * 10},${30 - Math.random() * 25}`).join(' ');
        const sparklineSvg = `<svg class="sparkline" viewBox="0 0 80 30"><polyline points="${points}" /></svg>`;

        // Check if selected [cite: 275]
        const isSelected = LookerCharts.Utils.getCrossfilterSelection(row[titleDim]) === 1; // 1 = Selected

        // DOM Construction
        const rowDiv = document.createElement("div");
        rowDiv.className = `product-row ${isSelected ? 'active' : ''}`;

        rowDiv.innerHTML = `
            <img src="${safeImg}" class="prod-img" alt="${title}">
            <div class="prod-info">
                <div class="prod-title">${title}</div>
                <div class="prod-meta">
                    <span class="stars">★★★★☆ (4.5)</span>
                    <button class="add-btn">Add next</button>
                </div>
            </div>
            <div class="prod-price">${price}</div>
            <div class="stock-pill ${stockClass}">${status}</div>
            <div class="trend-box">${sparklineSvg}</div>
        `;

        // Cross-filter Interaction
        rowDiv.addEventListener('click', (event) => {
             // Don't trigger if clicking the "Add next" button (future feature)
             if (event.target.classList.contains('add-btn')) return;

             LookerCharts.Utils.toggleCrossfilter({
                row: row,
                pivot: null,
                event: event
             });
        });

        root.appendChild(rowDiv);
    });

    done();
  }
});
