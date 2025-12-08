/**
 * Fashion BI Review Distribution Chart
 * 5段階評価の分布を棒グラフで表示
 * Feature: Full Customization (Shadow, Padding, Colors, Radius, Border)
 */

looker.plugins.visualizations.add({
  // 設定オプション
  options: {
    // --- スタイル設定 (色・形) ---
    bar_color: {
      type: "string",
      label: "Bar Color",
      default: "#AA7777",
      display: "color",
      section: "Style"
    },
    text_color: {
      type: "string",
      label: "Text Color",
      default: "#333333",
      display: "color",
      section: "Style"
    },
    chart_bg_color: {
      type: "string",
      label: "Background Color",
      default: "#FFFFFF",
      display: "color",
      section: "Style"
    },
    // --- 影と丸み、枠線の設定 ---
    border_radius: {
      type: "number",
      label: "Border Radius (px)",
      default: 12,
      display: "range",
      min: 0,
      max: 50,
      section: "Box Style"
    },
    // ★追加: 枠線の太さ
    border_width: {
      type: "number",
      label: "Border Width (px)",
      default: 1,
      display: "range",
      min: 0,
      max: 10,
      section: "Box Style"
    },
    // ★追加: 枠線の色
    border_color: {
      type: "string",
      label: "Border Color",
      default: "#E0E0E0",
      display: "color",
      section: "Box Style"
    },
    shadow_depth: {
      type: "number",
      label: "Shadow Depth (0=Flat)",
      default: 2, // 程よい影
      display: "range",
      min: 0,
      max: 5, // 0から5の段階で影を強くできる
      step: 1,
      section: "Box Style"
    },
    // --- 余白の設定 (位置調整) ---
    padding_left: {
      type: "number",
      label: "Padding Left (px)",
      default: 20,
      display: "range",
      min: 0,
      max: 100,
      section: "Position"
    },
    padding_right: {
      type: "number",
      label: "Padding Right (px)",
      default: 20,
      display: "range",
      min: 0,
      max: 100,
      section: "Position"
    },
    padding_vertical: {
      type: "number",
      label: "Padding Vertical (px)",
      default: 20,
      display: "range",
      min: 0,
      max: 100,
      section: "Position"
    },
    // --- コンテンツ設定 ---
    show_percentage: {
      type: "boolean",
      label: "Show Percentage",
      default: true,
      section: "Content"
    },
    show_value: {
      type: "boolean",
      label: "Show Value",
      default: true,
      section: "Content"
    }
  },

  create: function(element, config) {
    // 基本レイアウト
    element.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');

        /* コンテナ自体のスタイルはupdateAsyncで動的に制御するため、
           ここではレイアウトの基礎のみ定義します */
        .chart-container {
          font-family: 'Inter', sans-serif;
          height: 100%;
          overflow-y: auto;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: center;
          /* ボーダーの初期値はスクリプトで制御するためここでは削除 */
          transition: all 0.3s ease; /* 設定変更時のアニメーション */
        }

        .chart-row {
          display: flex;
          align-items: center;
          margin-bottom: 12px;
          height: 24px;
          cursor: pointer;
          transition: opacity 0.3s ease;
        }

        .chart-row.dimmed {
          opacity: 0.3;
        }

        .chart-row:hover {
          opacity: 0.8;
        }

        /* 左側のラベル（星の数など） */
        .row-label {
          width: 60px;
          font-size: 13px;
          color: #666;
          text-align: right;
          margin-right: 12px;
          white-space: nowrap;
          display: flex;
          justify-content: flex-end;
          align-items: center;
        }

        .star-icon {
          color: #FFC107;
          margin-right: 4px;
        }

        /* バーの背景（グレーのレール） */
        .bar-track {
          flex-grow: 1;
          background-color: #F0F0F0;
          height: 12px;
          border-radius: 6px;
          overflow: hidden;
          margin-right: 12px;
        }

        /* 実際の値を示すバー */
        .bar-fill {
          height: 100%;
          border-radius: 6px;
          width: 0;
          transition: width 0.8s cubic-bezier(0.22, 1, 0.36, 1);
        }

        /* 右側の数値ラベル */
        .row-value {
          width: 80px;
          font-size: 13px;
          font-weight: 600;
          text-align: left;
        }

        .empty-message {
          text-align: center;
          color: #999;
          margin-top: 20px;
        }
      </style>
      <div id="viz-chart" class="chart-container"></div>
    `;
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    const container = element.querySelector("#viz-chart");
    this.clearErrors();

    // --- 【重要】動的スタイル適用エリア ---

    // 1. 背景色と角丸
    container.style.backgroundColor = config.chart_bg_color;
    container.style.borderRadius = `${config.border_radius}px`;

    // 2. ★追加: 枠線 (Border) の適用
    // ユーザー設定の太さと色を適用します
    const bWidth = (config.border_width !== undefined) ? config.border_width : 1;
    const bColor = config.border_color || "#E0E0E0";

    if (bWidth > 0) {
        container.style.border = `${bWidth}px solid ${bColor}`;
    } else {
        container.style.border = "none";
    }

    // 3. 余白 (Padding) の適用
    container.style.paddingLeft = `${config.padding_left}px`;
    container.style.paddingRight = `${config.padding_right}px`;
    container.style.paddingTop = `${config.padding_vertical}px`;
    container.style.paddingBottom = `${config.padding_vertical}px`;

    // 4. 影 (Shadow) の計算と適用
    const depth = config.shadow_depth || 0;
    if (depth === 0) {
      container.style.boxShadow = "none";
    } else {
      // 影の深さに応じて blur と広がりを計算
      const y = depth * 2;
      const blur = depth * 6;
      const opacity = 0.03 + (depth * 0.02);
      container.style.boxShadow = `0 ${y}px ${blur}px rgba(0,0,0,${opacity})`;
    }

    // ------------------------------------

    // データチェック
    if (!data || data.length === 0) {
      container.innerHTML = `<div class="empty-message">No review data available</div>`;
      done();
      return;
    }

    const dimensions = queryResponse.fields.dimensions;
    const measures = queryResponse.fields.measures;

    if (dimensions.length === 0 || measures.length === 0) {
      this.addError({ title: "Data Error", message: "Dimension (Rating) and Measure (Count) are required." });
      return;
    }

    const dimName = dimensions[0].name;
    const measName = measures[0].name;

    // 総件数を計算
    let totalCount = 0;
    data.forEach(row => {
      const val = row[measName].value;
      if (val) totalCount += val;
    });

    container.innerHTML = "";

    data.forEach(row => {
      const scoreLabel = LookerCharts.Utils.textForCell(row[dimName]);
      const countVal = row[measName].value || 0;

      const percentage = totalCount > 0 ? (countVal / totalCount) * 100 : 0;
      const percentageStr = percentage.toFixed(1) + "%";
      const countStr = LookerCharts.Utils.textForCell(row[measName]);

      let valueLabel = "";
      if (config.show_value) valueLabel += countStr;
      if (config.show_value && config.show_percentage) valueLabel += ` <span style="font-weight:400; color:#888; font-size:11px;">(${percentageStr})</span>`;
      else if (!config.show_value && config.show_percentage) valueLabel += percentageStr;

      const rowDiv = document.createElement("div");
      rowDiv.className = "chart-row";

      const selectionState = LookerCharts.Utils.getCrossfilterSelection(row);
      if (selectionState === 2) {
        rowDiv.classList.add("dimmed");
      }

      rowDiv.innerHTML = `
        <div class="row-label">
          <span class="star-icon">★</span> ${scoreLabel}
        </div>
        <div class="bar-track">
          <div class="bar-fill" style="background-color: ${config.bar_color};"></div>
        </div>
        <div class="row-value" style="color: ${config.text_color};">
          ${valueLabel}
        </div>
      `;

      rowDiv.onclick = (event) => {
        if (details.crossfilterEnabled) {
          LookerCharts.Utils.toggleCrossfilter({
            row: row,
            event: event
          });
        }
      };

      container.appendChild(rowDiv);

      setTimeout(() => {
        const bar = rowDiv.querySelector(".bar-fill");
        if (bar) bar.style.width = `${percentage}%`;
      }, 50);
    });

    done();
  }
});
