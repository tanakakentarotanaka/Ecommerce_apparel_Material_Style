/**
 * Chic Color Palette Selector for Fashion BI
 * Updated with specific fashion color names and gradient support.
 */

looker.plugins.visualizations.add({
  // ユーザー設定オプション
  options: {
    swatch_size: {
      type: "number",
      label: "Swatch Size (px)",
      default: 40,
      display: "range",
      min: 20,
      max: 80
    }
  },

  create: function(element, config) {
    // スタイル定義
    element.innerHTML = `
      <style>
        .palette-container {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          justify-content: center; /* 左寄せにしたい場合は 'flex-start' に変更 */
          padding: 10px;
          font-family: 'Inter', sans-serif;
        }
        .swatch-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          transition: transform 0.2s;
          width: 60px; /* ラベルの折り返し幅を確保 */
        }
        .swatch-wrapper:hover {
          transform: translateY(-3px);
        }
        .swatch-circle {
          border-radius: 50%;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          border: 2px solid transparent; /* 選択時の枠線用スペース */
          transition: all 0.2s;
          /* backgroundプロパティを使用することでグラデーションに対応 */
          background-position: center;
          background-size: cover;
        }
        /* 選択されていない状態（薄くする） */
        .swatch-faded {
          opacity: 0.3;
          transform: scale(0.9);
        }
        /* 選択されている状態（強調） */
        .swatch-selected {
          border-color: #333333;
          transform: scale(1.1);
        }
        .swatch-label {
          margin-top: 6px;
          font-size: 10px;
          color: #333333;
          text-align: center;
          line-height: 1.2;
          letter-spacing: 0.3px;
        }
      </style>
      <div id="vis-container" class="palette-container"></div>
    `;
    this.container = element.querySelector("#vis-container");
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    this.container.innerHTML = ""; // クリア

    if (!data || data.length === 0) {
      this.addError({ title: "No Data", message: "データがありません" });
      return;
    }
    this.clearErrors();

    // 1. カラーマッピング辞書 (テキスト -> CSS background値)
    // 単色はHEXコード、Multi-Mutedはグラデーションで定義
    const colorMap = {
      "beige":       "#E8E0D5",            // 優しいベージュ
      "black":       "#222222",            // 真っ黒すぎないソフトブラック
      "camel":       "#C19A6B",            // 定番のキャメル
      "champagne":   "#F7E7CE",            // 淡いシャンパンゴールド
      "charcoal":    "#36454F",            // 青みがかった濃いグレー
      "cognac":      "#9A463D",            // 赤みのあるブラウン（コニャック）
      "dark brown":  "#4B3621",            // 深いブラウン
      "grey":        "#9E9E9E",            // 中間的なグレー
      "ivory":       "#FFFFF0",            // 黄みがかった白
      "navy":        "#202A44",            // 深いネイビー
      "oatmeal":     "#E0DCC8",            // 穀物のような生成り色
      "red":         "#B71C1C",            // 深紅（安っぽくない赤）
      "taupe":       "#876C5E",            // 茶色がかったグレー（トープ）
      "white":       "#FFFFFF",            // 白

      // 特殊な色の定義
      "multi-muted": "linear-gradient(135deg, #D7CCC8 25%, #90A4AE 50%, #BCAAA4 75%)" // 落ち着いたマルチカラーグラデーション
    };

    // デフォルト色
    const defaultColor = "#E0E0E0";

    const dimension = queryResponse.fields.dimensions[0];

    data.forEach((row) => {
      const value = row[dimension.name].value;
      const label = LookerCharts.Utils.textForCell(row[dimension.name]);

      // 小文字化してマッピングを検索
      // 見つからない場合はデフォルト色を使用
      let bgStyle = colorMap[String(value).toLowerCase()];
      if (!bgStyle) {
          // マップにない場合、値自体がHEXコードかもしれないのでチェック、違えばデフォルト
          bgStyle = defaultColor;
      }

      const selectionState = LookerCharts.Utils.getCrossfilterSelection(row);

      const wrapper = document.createElement("div");
      wrapper.className = "swatch-wrapper";

      if (selectionState === 2) {
         wrapper.classList.add("swatch-faded");
      }

      const circle = document.createElement("div");
      circle.className = "swatch-circle";

      if (selectionState === 1) {
        circle.classList.add("swatch-selected");
      }

      const size = config.swatch_size || 40;
      circle.style.width = size + "px";
      circle.style.height = size + "px";

      // ポイント: backgroundColorではなくbackgroundを使うことでグラデーションに対応
      circle.style.background = bgStyle;

      // 白やアイボリー、シャンパンなど明るい色は背景と同化しないように薄い枠線を追加
      const lightColors = ["#FFFFFF", "#FFFFF0", "#F7E7CE", "#E0DCC8", "#E8E0D5"];
      if (lightColors.includes(bgStyle.toUpperCase()) || label.toLowerCase() === "white") {
        circle.style.border = "1px solid #d0d0d0";
        // 選択時はクラス側のborder-colorが優先されるようCSSで調整済み
      }

      const textLabel = document.createElement("div");
      textLabel.className = "swatch-label";
      textLabel.innerText = label;

      wrapper.appendChild(circle);
      wrapper.appendChild(textLabel);

      wrapper.onclick = (event) => {
        if (details.crossfilterEnabled) {
          LookerCharts.Utils.toggleCrossfilter({
            row: row,
            event: event
          });
        }
      };

      this.container.appendChild(wrapper);
    });

    done();
  }
});
