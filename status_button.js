/**
 * Fashion BI Status Filter Button
 * "Returned" などをフィルタリングするためのボタンViz
 * Feature: Soft 3D Effect (Puffy Look), No Emojis, Full Border Control
 */

looker.plugins.visualizations.add({
  options: {
    // --- テキスト設定 ---
    font_size: {
      type: "number",
      label: "Font Size (px)",
      default: 14,
      display: "number",
      section: "Text"
    },
    text_color: {
      type: "string",
      label: "Text Color",
      default: "#C62828", // 濃い赤
      display: "color",
      section: "Text"
    },
    // --- ボタンのスタイル (色・形) ---
    button_color: {
      type: "string",
      label: "Button Color (Base)",
      default: "#FFEBEE", // 薄い赤
      display: "color",
      section: "Button Style"
    },
    border_radius: {
      type: "number",
      label: "Border Radius (px)",
      default: 24, // 丸みを強めに
      display: "range",
      min: 0,
      max: 50,
      section: "Button Style"
    },
    // --- 枠線 (Border) の設定 ---
    border_color: {
      type: "string",
      label: "Border Color",
      default: "#FFCDD2", // ボタンより少し濃い色
      display: "color",
      section: "Border"
    },
    border_width: {
      type: "number",
      label: "Border Width (px)",
      default: 1,
      display: "range",
      min: 0,
      max: 10,
      section: "Border"
    },
    // --- 影と立体感 ---
    shadow_depth: {
      type: "number",
      label: "3D Depth (Shadow)",
      default: 3,
      display: "range",
      min: 0,
      max: 5,
      section: "Button Style"
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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@500;600&display=swap');

        .button-container {
          font-family: 'Inter', sans-serif;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          box-sizing: border-box;
        }

        .status-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 24px;
          cursor: pointer;
          min-width: 120px;
          user-select: none;
          position: relative;
          transition: all 0.1s ease;

          /* 立体感を出すためのグラデーション（上から光が当たっている表現） */
          background-image: linear-gradient(to bottom, rgba(255,255,255,0.6), rgba(255,255,255,0) 50%, rgba(0,0,0,0.02));
        }

        .status-btn:hover {
          filter: brightness(1.02); /* ホバー時は少し明るく */
          transform: translateY(-1px);
        }

        .status-btn:active {
          transform: translateY(1px); /* クリックで沈む */
          filter: brightness(0.95);
        }

        /* 選択中（押し込まれた状態） */
        .status-btn.active {
          box-shadow: inset 0 3px 6px rgba(0,0,0,0.15) !important; /* 内側に影 */
          background-image: none; /* グラデーションを消してフラットに */
          transform: translateY(2px);
          border-color: currentColor !important; /* 枠線を文字色に合わせる */
        }

        .status-label {
          font-weight: 600;
          display: flex;
          align-items: center;
          letter-spacing: 0.5px;
        }

        .status-count {
          font-weight: 600;
          opacity: 0.8;
          margin-left: 12px;
          font-size: 0.9em;
          background: rgba(0,0,0,0.06); /* 文字色になじむ薄い背景 */
          padding: 2px 8px;
          border-radius: 12px;
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

    // データの取得
    const dimensions = queryResponse.fields.dimensions;
    const measures = queryResponse.fields.measures;

    if (dimensions.length === 0) {
      this.addError({ title: "Config Error", message: "Status Dimension is required." });
      return;
    }

    const dimName = dimensions[0].name;
    const measName = measures.length > 0 ? measures[0].name : null;

    container.innerHTML = "";

    // --- 3D影 (Shadow) の生成 ---
    // ボタンの「外側の影」と「内側の光（ハイライト）」を組み合わせて膨らみを表現
    const depth = config.shadow_depth || 0;
    let boxShadowStyle = "none";

    if (depth > 0) {
      const dropShadow = `0 ${depth * 2}px ${depth * 4}px rgba(0,0,0,0.1)`; // 落ち影
      const innerHighlight = `inset 0 1px 0 rgba(255,255,255,0.6)`; // 上部のハイライト線
      boxShadowStyle = `${dropShadow}, ${innerHighlight}`;
    }

    data.forEach(row => {
      const label = LookerCharts.Utils.textForCell(row[dimName]);
      const countVal = measName ? LookerCharts.Utils.textForCell(row[measName]) : "";

      const btn = document.createElement("div");
      btn.className = "status-btn";

      // --- スタイルの動的適用 ---
      btn.style.backgroundColor = config.button_color;
      btn.style.color = config.text_color;

      // 丸み
      btn.style.borderRadius = `${config.border_radius}px`;

      // 枠線
      btn.style.border = `${config.border_width}px solid ${config.border_color}`;

      // フォントサイズ
      btn.style.fontSize = `${config.font_size}px`;

      // 影（立体感）
      btn.style.boxShadow = boxShadowStyle;

      // 選択状態の判定
      const selectionState = LookerCharts.Utils.getCrossfilterSelection(row);
      if (selectionState === 1) { // SELECTED
        btn.classList.add("active");
        // アクティブ時は枠線を強調（文字色と同じにするなど）
        btn.style.borderColor = config.text_color;
      } else if (selectionState === 2) { // UNSELECTED
        btn.style.opacity = "0.6"; // 非選択時は薄く
      }

      // HTML構成 (絵文字なし)
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
