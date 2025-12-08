/**
 * Fashion BI: Luxury Metric List
 * * デザイン重視のリスト表示Viz。
 * 枠線、影、余白、角丸を細かく調整可能にし、
 * 「カード型」や「フラット型」など多様なスタイルに対応。
 */

looker.plugins.visualizations.add({
  // -----------------------------------------------------------
  // 1. Options: ユーザーがGUIで変更できる設定項目 [cite: 382]
  // -----------------------------------------------------------
  options: {
    // --- Box Styling (枠線と形状) ---
    border_radius: {
      type: "number",
      label: "Corner Radius (px)",
      default: 12,
      display: "range",
      min: 0,
      max: 50,
      section: "Box Design"
    },
    border_width: {
      type: "number",
      label: "Border Width (px)",
      default: 1,
      display: "range",
      min: 0,
      max: 10,
      section: "Box Design"
    },
    border_color: {
      type: "string",
      label: "Border Color",
      default: "#E0E0E0",
      display: "color",
      section: "Box Design"
    },
    shadow_depth: {
      type: "number",
      label: "Shadow Intensity",
      default: 2,
      display: "range",
      min: 0,
      max: 5,
      section: "Box Design"
    },

    // --- Content Styling (中身の色) ---
    bar_color: {
      type: "string",
      label: "Bar Color",
      default: "#AA7777", // Rose Quartz Theme Color
      display: "color",
      section: "Colors"
    },
    text_color: {
      type: "string",
      label: "Text Color",
      default: "#333333", // Theme Text Color [cite: 8]
      display: "color",
      section: "Colors"
    },

    // --- Layout (余白) ---
    padding_x: {
      type: "number",
      label: "Horizontal Padding",
      default: 16,
      section: "Layout"
    },
    padding_y: {
      type: "number",
      label: "Vertical Padding",
      default: 8,
      section: "Layout"
    }
  },

  // -----------------------------------------------------------
  // 2. Create: 初期化処理 [cite: 198]
  // -----------------------------------------------------------
  create: function(element, config) {
    // スタイルシートの定義
    element.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

        .luxury-list-container {
          font-family: 'Inter', sans-serif; /* テーマフォント [cite: 13] */
          height: 100%;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
        }

        /* 個別の行アイテム */
        .list-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s;
          position: relative;
          background: #FFFFFF;
        }

        .list-item:hover {
          transform: translateY(-2px);
        }

        /* クロスフィルタで非選択状態になった時のスタイル */
        .list-item.dimmed {
          opacity: 0.3;
          transform: none;
          box-shadow: none !important;
        }

        .label-section {
          flex: 1;
          z-index: 2;
          font-weight: 500;
          font-size: 14px;
        }

        .value-section {
          z-index: 2;
          font-weight: 600;
          font-size: 14px;
          text-align: right;
        }

        /* 背景のバー */
        .progress-bg {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          opacity: 0.1; /* バーを薄く表示して上品に */
          z-index: 1;
          transition: width 1s cubic-bezier(0.16, 1, 0.3, 1);
          border-radius: inherit; /* 親の角丸を継承 */
        }
      </style>
      <div id="viz-root" class="luxury-list-container"></div>
    `;
  },

  // -----------------------------------------------------------
  // 3. UpdateAsync: 描画更新処理 [cite: 264]
  // -----------------------------------------------------------
  updateAsync: function(data, element, config, queryResponse, details, done) {
    const root = element.querySelector("#viz-root");
    this.clearErrors(); // エラーのクリア [cite: 233]

    // --- エラーハンドリング ---
    if (!data || data.length === 0) {
      this.addError({title: "No Data", message: "データがありません。"});
      return;
    }
    if (queryResponse.fields.dimensions.length === 0 || queryResponse.fields.measures.length === 0) {
      this.addError({title: "Incomplete Data", message: "ディメンション1つとメジャー1つが必要です。"}); // [cite: 221]
      return;
    }

    const dim = queryResponse.fields.dimensions[0];
    const measure = queryResponse.fields.measures[0];

    // メジャーの最大値を取得（バーの長さを決めるため）
    const maxVal = Math.max(...data.map(d => d[measure.name].value));

    root.innerHTML = ""; // コンテナのリセット

    // --- データループと描画 ---
    data.forEach(row => {
      // セルの値を取得
      const labelText = LookerCharts.Utils.textForCell(row[dim.name]); // [cite: 315]
      const valueText = LookerCharts.Utils.textForCell(row[measure.name]);
      const valueRaw = row[measure.name].value;

      // バーの割合計算
      const percent = maxVal > 0 ? (valueRaw / maxVal) * 100 : 0;

      // 要素の作成
      const item = document.createElement("div");
      item.className = "list-item";

      // --- スタイルの動的適用 (ここが要望の核心部分です) ---
      item.style.borderRadius = `${config.border_radius}px`;
      item.style.border = `${config.border_width}px solid ${config.border_color}`;
      item.style.padding = `${config.padding_y}px ${config.padding_x}px`;
      item.style.color = config.text_color;

      // 影の設定 (入力値に応じて濃さと広がりを調整)
      if (config.shadow_depth > 0) {
        const blur = config.shadow_depth * 4;
        const alpha = 0.05 * config.shadow_depth;
        item.style.boxShadow = `0 2px ${blur}px rgba(0,0,0,${alpha})`;
      } else {
        item.style.boxShadow = "none";
      }

      // --- クロスフィルタリングの状態確認 [cite: 339] ---
      // 0: NONE, 1: SELECTED, 2: UNSELECTED
      const selectionState = LookerCharts.Utils.getCrossfilterSelection(row);
      if (selectionState === 2) { // 選択されていない行を薄くする
        item.classList.add("dimmed");
      }

      // HTMLの構築
      item.innerHTML = `
        <div class="progress-bg" style="width: ${percent}%; background-color: ${config.bar_color};"></div>
        <div class="label-section">${labelText}</div>
        <div class="value-section">${valueText}</div>
      `;

      // --- クリックイベント (クロスフィルタ発火) [cite: 325] ---
      item.onclick = (event) => {
        // クロスフィルタが有効かチェック
        if (details.crossfilterEnabled) {
             LookerCharts.Utils.toggleCrossfilter({
               row: row,
               event: event
             });
        }
      };

      root.appendChild(item);
    });

    // 描画完了を通知 [cite: 304]
    done();
  }
});
