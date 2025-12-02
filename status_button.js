/**
 * Fashion BI Status Filter Button
 * Filters the dashboard by a specific status (e.g., "Returned")
 * Design: Matches the flat "Returned" tag in review_list.js
 */

looker.plugins.visualizations.add({
  options: {
    // --- テキスト設定 ---
    font_size: {
      type: "number",
      label: "Font Size (px)",
      default: 12, // リストのタグに合わせて小さめに
      display: "number",
      section: "Style"
    },
    text_color: {
      type: "string",
      label: "Text Color",
      default: "#C62828", // リストと同じ濃い赤
      display: "color",
      section: "Style"
    },
    // --- ボタンスタイル ---
    button_color: {
      type: "string",
      label: "Background Color",
      default: "#FFEBEE", // リストと同じ薄い赤
      display: "color",
      section: "Style"
    },
    border_radius: {
      type: "number",
      label: "Border Radius (px)",
      default: 20, // 完全に丸いピル型
      display: "range",
      min: 0,
      max: 50,
      section: "Style"
    },
    // --- 枠線設定 (リストのタグにはないが、ボタンとしての視認性のため調整可能に) ---
    border_width: {
      type: "number",
      label: "Border Width (px)",
      default: 0, // デフォルトは枠線なし（タグと同じ）
      display: "range",
      min: 0,
      max: 5,
      section: "Border"
    },
    border_color: {
      type: "string",
      label: "Border Color",
      default: "#FFCDD2",
      display: "color",
      section: "Border"
    },
    // --- 影設定 (微調整用) ---
    shadow_depth: {
      type: "number",
      label: "Shadow Depth",
      default: 0, // デフォルトはフラット
      display: "range",
      min: 0,
      max: 5,
      section: "Style"
    },
    // --- コンテンツ ---
    show_count: {
      type: "boolean",
      label: "Show Count",
      default: true,
      section: "Content"
    }
  },

  create: function(element, config) {
    element.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@600&display=swap');

        .button-container {
          font-family: 'Inter', sans-serif;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          box-sizing: border-box;
        }

        .status-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 6px 16px; /* タグらしいコンパクトなパディング */
          cursor: pointer;
          user-select: none;
          transition: all 0.2s ease;
          font-weight: 600; /* 太字で視認性を確保 */
          line-height: 1.2;
        }

        /* ホバー時の挙動: 少しだけ濃くして「押せる」ことを伝える */
        .status-btn:hover {
          filter: brightness(0.95);
          transform: translateY(-1px);
        }

        .status-btn:active {
          transform: translateY(0);
          filter: brightness(0.9);
        }

        /* 選択中（フィルタ適用中）: 枠線で強調 */
        .status-btn.active {
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.1); /* 内側に影 */
          border: 2px solid currentColor !important; /* 文字色と同じ枠線を強制適用 */
          padding: 4px 14px; /* ボーダー分パディングを調整してサイズ維持 */
        }

        /* 非選択状態（他が選ばれている時） */
        .status-btn.dimmed {
          opacity: 0.4;
        }

        .status-label {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .status-count {
          opacity: 0.8;
          margin-left: 8px;
          font-size: 0.9em;
          background: rgba(0,0,0,0.05);
          padding: 1px 6px;
          border-radius: 10px;
        }
      </style>
      <div id="viz-root" class="button-container"></div>
    `;
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    const container = element.querySelector("#viz-root");
    this.clearErrors();

    if (!data || data.length === 0) {
      container.innerHTML = "";
      done();
      return;
    }

    const dimensions = queryResponse.fields.dimensions;
    const measures = queryResponse.fields.measures;

    if (dimensions.length === 0) {
      this.addError({ title: "Config Error", message: "Status Dimension is required." });
      return;
    }

    const dimName = dimensions[0].name;
    const measName = measures.length > 0 ? measures[0].name : null;

    container.innerHTML = "";

    // 影スタイルの計算
    const depth = config.shadow_depth || 0;
    let boxShadowStyle = "none";
    if (depth > 0) {
      boxShadowStyle = `0 ${depth}px ${depth * 2}px rgba(0,0,0,0.1)`;
    }

    data.forEach(row => {
      const label = LookerCharts.Utils.textForCell(row[dimName]);
      const countVal = measName ? LookerCharts.Utils.textForCell(row[measName]) : "";

      const btn = document.createElement("div");
      btn.className = "status-btn";

      // スタイル適用
      btn.style.backgroundColor = config.button_color;
      btn.style.color = config.text_color;
      btn.style.borderRadius = `${config.border_radius}px`;
      btn.style.border = `${config.border_width}px solid ${config.border_color}`;
      btn.style.fontSize = `${config.font_size}px`;
      btn.style.boxShadow = boxShadowStyle;

      // 選択状態の判定
      const selectionState = LookerCharts.Utils.getCrossfilterSelection(row);
      if (selectionState === 1) { // SELECTED
        btn.classList.add("active");
        // アクティブ時は枠線を強制的に太くするためborderスタイルを上書き
        btn.style.borderWidth = "2px";
        btn.style.borderColor = config.text_color;
      } else if (selectionState === 2) { // UNSELECTED
        btn.classList.add("dimmed");
      }

      // HTML構成
      btn.innerHTML = `
        <div class="status-label">
          ${label}
        </div>
        ${config.show_count && countVal ? `<div class="status-count">${countVal}</div>` : ""}
      `;

      btn.onclick = (event) => {
        if (details.crossfilterEnabled) {
          LookerCharts.Utils.toggleCrossfilter({
            row: row,
            event: event
          });
        }
      };

      container.appendChild(btn);
    });

    done();
  }
});
