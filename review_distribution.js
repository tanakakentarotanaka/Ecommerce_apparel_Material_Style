/**
 * Fashion BI Review Distribution Chart
 * 5段階評価の分布を棒グラフで表示（インタラクティブなクロスフィルタリング対応）
 */

looker.plugins.visualizations.add({
  // 設定オプション
  options: {
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
    // スタイル定義
    element.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');

        .chart-container {
          font-family: 'Inter', sans-serif;
          padding: 20px; /* パディングを少し増やす */
          height: 100%;
          overflow-y: auto;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: center;
          /* 背景と枠線を追加 */
          background-color: #ffffff;
          border: 1px solid #E0E0E0;
          border-radius: 12px; /* 角丸を追加 */
        }

        .chart-row {
          display: flex;
          align-items: center;
          margin-bottom: 12px;
          height: 24px;
          cursor: pointer; /* クリックできることを示す */
          transition: opacity 0.3s ease;
        }

        /* 選択されていない行を薄くするクラス */
        .chart-row.dimmed {
          opacity: 0.3;
        }

        .chart-row:hover {
          opacity: 0.8; /* ホバー時のエフェクト */
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
          width: 0; /* アニメーション用初期値 */
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

    // 総件数を計算（割合算出のため）
    let totalCount = 0;
    data.forEach(row => {
      const val = row[measName].value;
      if (val) totalCount += val;
    });

    // チャート再描画
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

      // 行の作成
      const rowDiv = document.createElement("div");
      rowDiv.className = "chart-row";

      // クロスフィルタリングの状態判定
      // 0 = NONE, 1 = SELECTED, 2 = UNSELECTED
      const selectionState = LookerCharts.Utils.getCrossfilterSelection(row);

      // 選択されていない行（他に選択がある場合）は薄くする
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

      // クリックイベント設定（クロスフィルタリングの発火） [cite: 331, 332]
      rowDiv.onclick = (event) => {
        if (details.crossfilterEnabled) {
          LookerCharts.Utils.toggleCrossfilter({
            row: row,
            event: event
          });
        }
      };

      container.appendChild(rowDiv);

      // アニメーション実行
      setTimeout(() => {
        const bar = rowDiv.querySelector(".bar-fill");
        if (bar) bar.style.width = `${percentage}%`;
      }, 50);
    });

    done();
  }
});
