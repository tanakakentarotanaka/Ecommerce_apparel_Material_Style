/**
 * Chic Color Palette Selector for Fashion BI
 * "red" などのテキストデータを美しいスウォッチに変換し、クロスフィルターを適用します。
 */

looker.plugins.visualizations.add({
  // ユーザー設定オプション（必要に応じて追加可能）
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
    // スタイル定義：Rose Quartz Runwayテーマに合わせる [cite: 99]
    element.innerHTML = `
      <style>
        .palette-container {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          justify-content: center;
          padding: 10px;
          font-family: 'Inter', sans-serif; /* [cite: 110] */
        }
        .swatch-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .swatch-wrapper:hover {
          transform: translateY(-3px);
        }
        .swatch-circle {
          border-radius: 50%;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          border: 2px solid transparent;
          transition: all 0.2s;
        }
        /* 選択されていない状態を目立たなくするスタイル */
        .swatch-faded {
          opacity: 0.3;
          transform: scale(0.9);
        }
        /* 選択されている状態のスタイル */
        .swatch-selected {
          border-color: #333333; /* テキスト色に合わせる [cite: 105] */
          transform: scale(1.1);
        }
        .swatch-label {
          margin-top: 4px;
          font-size: 10px;
          color: #333333; /* [cite: 136] */
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      </style>
      <div id="vis-container" class="palette-container"></div>
    `;
    this.container = element.querySelector("#vis-container");
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    this.container.innerHTML = ""; // クリア

    // エラーハンドリング [cite: 221]
    if (!data || data.length === 0) {
      this.addError({ title: "No Data", message: "データがありません" });
      return;
    }
    this.clearErrors(); // [cite: 233]

    // 1. カラーマッピング辞書 (テキスト -> HEX)
    // ファッション独特のニュアンスカラーをここで定義します
    const colorMap = {
      "red": "#E57373",      // 柔らかな赤
      "blue": "#64B5F6",     // 爽やかな青
      "navy": "#2c3e50",     // シックなネイビー
      "black": "#333333",    // 墨色に近い黒
      "white": "#FFFFFF",    // 白
      "beige": "#D7CCC8",    // ベージュ
      "pink": "#F48FB1",     // ローズピンク
      "green": "#81C784",    // 優しい緑
      "grey": "#90A4AE",     // グレー
      "gold": "#FFD54F"      // アクセントゴールド
    };

    // デフォルト色（マッピングにない場合）
    const defaultColor = "#E0E0E0";

    const dimension = queryResponse.fields.dimensions[0]; // 最初のディメンションを使用

    // データ行ごとの描画ループ
    data.forEach((row) => {
      const value = row[dimension.name].value; // "red" などの生データ [cite: 309]
      const label = LookerCharts.Utils.textForCell(row[dimension.name]); // 表示用ラベル [cite: 315]

      // テキストからHEXカラーを取得（小文字化して検索）
      const hexColor = colorMap[String(value).toLowerCase()] || defaultColor;

      // クロスフィルターの選択状態を確認
      // 0: NONE, 1: SELECTED, 2: UNSELECTED
      const selectionState = LookerCharts.Utils.getCrossfilterSelection(row);

      // DOM要素の作成
      const wrapper = document.createElement("div");
      wrapper.className = "swatch-wrapper";

      // 選択状態に応じたクラス付与
      if (selectionState === 2) { // Unselected (他の色が選ばれている)
         wrapper.classList.add("swatch-faded");
      }

      const circle = document.createElement("div");
      circle.className = "swatch-circle";
      if (selectionState === 1) { // Selected (この色が選ばれている)
        circle.classList.add("swatch-selected");
      }

      // サイズ設定
      const size = config.swatch_size || 40;
      circle.style.width = size + "px";
      circle.style.height = size + "px";
      circle.style.backgroundColor = hexColor;

      // "White"の場合は枠線をつけて見やすくする
      if (hexColor.toUpperCase() === "#FFFFFF") {
        circle.style.border = "1px solid #e0e0e0";
      }

      const textLabel = document.createElement("div");
      textLabel.className = "swatch-label";
      textLabel.innerText = label;

      wrapper.appendChild(circle);
      wrapper.appendChild(textLabel);

      // クリックイベント：クロスフィルターの発火
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

    done(); // 描画完了通知 [cite: 303]
  }
});
