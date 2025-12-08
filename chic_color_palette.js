/**
 * Chic Color Palette Selector for Fashion BI
 * Updated: Adds configurable Background Corner Radius options.
 */

looker.plugins.visualizations.add({
  // ユーザー設定オプション
  options: {
    // 1. スウォッチのサイズ設定
    swatch_size: {
      type: "number",
      label: "Swatch Size (px)",
      default: 35,
      display: "range",
      min: 20,
      max: 60,
      section: "Style"
    },
    // 2. 形状設定
    shape: {
      type: "string",
      label: "Shape",
      display: "select",
      values: [
        {"Honeycomb (Hexagon)": "hexagon"},
        {"Circle": "circle"},
        {"Square / Rounded (Custom)": "custom"}
      ],
      default: "hexagon",
      section: "Style"
    },
    // 3. スウォッチ（色見本）自体の角丸設定（Custom選択時のみ有効）
    swatch_radius: {
      type: "number",
      label: "Swatch Radius (px)",
      default: 8,
      display: "range",
      min: 0,
      max: 30,
      section: "Style"
    },
    // 4. 背景色の設定
    viz_background_color: {
      type: "string",
      label: "Background Color",
      default: "transparent",
      display: "color",
      section: "Background" // 背景関連を別セクションに整理
    },
    // 5. 背景（コンテナ）の角丸設定 ★追加機能
    viz_border_radius: {
      type: "number",
      label: "Background Radius (px)",
      default: 16,
      display: "range",
      min: 0,
      max: 50, // 大きく設定できるように変更
      section: "Background"
    }
  },

  create: function(element, config) {
    // スタイル定義
    element.innerHTML = `
      <style>
        .palette-container {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: center;
          align-items: center;
          padding: 15px;
          font-family: 'Inter', sans-
