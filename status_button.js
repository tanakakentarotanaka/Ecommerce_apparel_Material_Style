/**
 * Fashion BI Status Filter Button
 * 特定のステータス（Returnedなど）をフィルタリングするためのボタンViz
 * Feature: Customizable Background, Shadow, Radius
 */

looker.plugins.visualizations.add({
  options: {
    // --- スタイル設定 ---
    font_size: {
      type: "number",
      label: "Font Size (px)",
      default: 14,
      display: "number",
      section: "Style"
    },
    button_color: {
      type: "string",
      label: "Button Color",
      default: "#FFEBEE", // デフォルトは薄い赤（返品色）
      display: "color",
      section: "Style"
    },
    text_color: {
      type: "string",
      label: "Text Color",
      default: "#C62828", // デフォルトは濃い赤
      display: "color",
      section: "Style"
    },
    // --- ボックス設定 ---
    border_radius: {
      type: "number",
      label: "Border Radius (px)",
      default: 12,
      display: "range",
      min: 0,
      max: 50,
      section: "Box Style"
    },
    shadow_depth: {
      type: "number",
      label: "Shadow Depth (0-5)",
      default: 2,
      display: "range",
      min: 0,
      max: 5,
      step: 1,
      section: "Box Style"
    },
    // --- コンテンツ設定 ---
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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@500;700&display=swap');

        .button-container {
          font-family: 'Inter', sans-serif;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center; /* 中央配置 */
          padding: 8px;
          box-sizing: border-box;
          overflow: hidden;
        }

        .status-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 20px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
          border: 1px solid transparent; /* 境界線用 */
          min-width: 140px; /* ある程度の幅を確保 */
          user-select: none;
        }

        .status-btn:hover {
          transform: translateY(-2px); /* ホバーで少し浮く */
        }

        .status-btn:active {
          transform: translateY(0); /* クリックで沈む */
        }

        /* 選択中（アクティブ）のスタイル */
        .status-btn.active {
          border: 2px solid currentColor; /* 文字色と同じ枠線 */
          filter: brightness(0.95); /* 少し暗くする */
          transform: translateY(1px); /* 押し込まれた状態 */
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.1) !important; /* 内側に影 */
        }

        .status-label {
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-count {
          font-weight: 700;
          opacity: 0.8;
          margin-left: 12px;
          font-size: 0.9em;
          background: rgba(0,0,0,0.05);
          padding: 2px 8px;
          border-radius: 10px;
        }

        .icon {
          font-size: 1.2em;
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

    // ディメンションとメジャーの取得
    // Dim1: ステータス名 ("Returned"など)
    // Meas1: 件数 (オプション)
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
    let shadowStyle = "none";
    let borderStyle = "1px solid rgba(0,0,0,0.1)"; // デフォルト枠線

    if (depth > 0) {
      const y = depth * 2;
      const blur = depth * 5;
      const opacity = 0.05 + (depth * 0.03);
      shadowStyle = `0 ${y}px ${blur}px rgba(0,0,0,${opacity})`;
      borderStyle = "1px solid rgba(0,0,0,0.02)"; // 影がある時は枠線を薄く
    }

    // データ行ごとにボタンを作成（通常は「Returned」で絞り込んで1つだけ表示する想定）
    data.forEach(row => {
      const label = LookerCharts.Utils.textForCell(row[dimName]);
      const countVal = measName ? LookerCharts.Utils.textForCell(row[measName]) : "";

      // アイコンの自動判定
      let icon = "";
      const lowerLabel = label.toLowerCase();
      if (lowerLabel.includes("return")) icon = "↩️";
      else if (lowerLabel.includes("check")) icon = "✅";
      else if (lowerLabel.includes("warning")) icon = "⚠️";

      const btn = document.createElement("div");
      btn.className = "status-btn";

      // スタイル適用
      btn.style.backgroundColor = config.button_color;
      btn.style.color = config.text_color;
      btn.style.borderRadius = `${config.border_radius}px`;
      btn.style.boxShadow = shadowStyle;
      btn.style.border = borderStyle;
      btn.style.fontSize = `${config.font_size}px`;

      // 選択状態の判定
      const selectionState = LookerCharts.Utils.getCrossfilterSelection(row);
      if (selectionState === 1) { // SELECTED
        btn.classList.add("active");
        btn.style.boxShadow = "none"; // アクティブ時は影を消す（押し込み表現）
      } else if (selectionState === 2) { // UNSELECTED
        btn.style.opacity = "0.5"; // 他が選ばれている時は薄くする
      }

      // HTML構成
      btn.innerHTML = `
        <div class="status-label">
          ${icon ? `<span class="icon">${icon}</span>` : ""}
          ${label}
        </div>
        ${config.show_count && countVal ? `<div class="status-count">${countVal}</div>` : ""}
      `;

      // クリックイベント
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
