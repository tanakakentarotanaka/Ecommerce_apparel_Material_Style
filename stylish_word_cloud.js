/**
 * Stylish & Elegant Word Cloud for Fashion BI
 * * Dependencies: D3.js v7, d3-cloud
 */

looker.plugins.visualizations.add({
  // ユーザーが編集画面で設定できる項目 [cite: 211, 381]
  options: {
    title_text: {
      type: "string",
      label: "タイトルラベル",
      display: "text",
      default: "Trending Keywords",
      section: "デザイン設定",
      order: 1
    },
    title_color: {
      type: "string",
      label: "タイトルの色",
      display: "color",
      default: "#AA7777", // テーマのメインカラー [cite: 133]
      section: "デザイン設定",
      order: 2
    },
    bg_color: {
      type: "string",
      label: "背景色",
      display: "color",
      default: "#FAF9F8", // テーマの背景色 [cite: 108]
      section: "デザイン設定",
      order: 3
    },
    border_radius: {
      type: "number",
      label: "角丸のサイズ (px)",
      display: "text",
      default: 24, // テーマの境界半径 [cite: 160]
      section: "デザイン設定",
      order: 4
    },
    font_family: {
      type: "string",
      label: "フォント",
      display: "text",
      default: "'Inter', sans-serif", // テーマのフォント [cite: 110]
      section: "デザイン設定",
      order: 5
    }
  },

  // ビジュアライゼーションの初期化 [cite: 198]
  create: function(element, config) {
    element.innerHTML = "";

    // スタイルコンテナの作成
    var container = element.appendChild(document.createElement("div"));
    container.id = "viz-container";
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.overflow = "hidden";
    container.style.padding = "16px";
    container.style.boxSizing = "border-box";

    // タイトル要素の作成
    var title = container.appendChild(document.createElement("h3"));
    title.id = "viz-title";
    title.style.margin = "0 0 10px 0";
    title.style.textAlign = "center"; // テーマのタイトル配置 [cite: 145]
    title.style.fontSize = "1.2rem";

    // ワードクラウド描画領域（SVG）のコンテナ
    var chartArea = container.appendChild(document.createElement("div"));
    chartArea.id = "chart-area";
    chartArea.style.flex = "1";
    chartArea.style.width = "100%";
    chartArea.style.position = "relative";
  },

  // データの更新時に実行される関数 [cite: 203, 260]
  updateAsync: function(data, element, config, queryResponse, details, done) {
    this.clearErrors(); // エラーのクリア [cite: 232]

    // 必須要件: 1つのディメンションと1つのメジャーが必要
    if (queryResponse.fields.dimensions.length === 0 || queryResponse.fields.measures.length === 0) {
      this.addError({ title: "データ不足", message: "1つのディメンションと1つのメジャーを選択してください。" }); // [cite: 221]
      return;
    }

    // デザイン設定の適用
    var container = element.querySelector("#viz-container");
    container.style.backgroundColor = config.bg_color || "#FAF9F8";
    container.style.borderRadius = (config.border_radius || 0) + "px";
    container.style.fontFamily = config.font_family || "'Inter', sans-serif";

    var title = element.querySelector("#viz-title");
    title.innerText = config.title_text || "";
    title.style.color = config.title_color || "#AA7777";
    title.style.display = config.title_text ? "block" : "none";

    // チャート領域のサイズ取得
    var chartArea = element.querySelector("#chart-area");
    chartArea.innerHTML = ""; // 描画リセット
    var width = chartArea.clientWidth;
    var height = chartArea.clientHeight;

    // データの整形
    var dimension = queryResponse.fields.dimensions[0];
    var measure = queryResponse.fields.measures[0];

    // 値の範囲を取得（フォントサイズの計算用）
    var maxVal = 0;
    var minVal = Infinity;

    var words = data.map(function(row) {
      var val = row[measure.name].value;
      if (val > maxVal) maxVal = val;
      if (val < minVal) minVal = val;

      return {
        text: LookerCharts.Utils.textForCell(row[dimension.name]), // 表示用テキスト [cite: 315]
        size: val,
        row: row, // クロスフィルタリング用に保持
        data: row[dimension.name] // ドリルダウン/リンク用
      };
    });

    // フォントサイズのスケール関数 (線形)
    var fontScale = d3.scaleLinear()
      .domain([minVal, maxVal])
      .range([14, 50]); // 最小14px, 最大50px

    // カラーパレット（テーマに合わせた色）
    var colors = ["#AA7777", "#333333", "#888888", "#D4C4B7", "#AA9999"];

    // d3-cloud レイアウト設定
    var layout = d3.layout.cloud()
      .size([width, height])
      .words(words)
      .padding(10) // 文字間隔を広めにとってエレガントに
      .rotate(0) // 全て横書き（回転なし）で読みやすく
      .font(config.font_family)
      .fontSize(function(d) { return fontScale(d.size); })
      .on("end", draw);

    layout.start();

    // 描画関数
    function draw(words) {
      var svg = d3.select(chartArea).append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

      var textGroup = svg.selectAll("text")
        .data(words)
        .enter().append("text")
        .style("font-size", function(d) { return d.size + "px"; })
        .style("font-family", config.font_family)
        .style("fill", function(d, i) { return colors[i % colors.length]; })
        .attr("text-anchor", "middle")
        .attr("transform", function(d) {
          return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
        })
        .text(function(d) { return d.text; })
        .style("cursor", "pointer")
        .style("opacity", 0.9)
        .on("mouseover", function() { d3.select(this).style("opacity", 1); })
        .on("mouseout", function() { d3.select(this).style("opacity", 0.9); });

      // クロスフィルタリングの実装
      textGroup.on("click", function(event, d) {
        // クロスフィルタが有効かチェック
        if (details.crossfilterEnabled) {
          LookerCharts.Utils.toggleCrossfilter({
            row: d.row,
            event: event
          });
        }
      });

      done(); // 描画完了を通知 [cite: 303, 304]
    }
  }
});
