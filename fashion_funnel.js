/**
 * Fashion BI Funnel Visualization
 * Rose Quartz Runway Theme
 */

looker.plugins.visualizations.add({
  // 設定オプション（ユーザーが編集画面で変更できる項目） [cite: 211, 381]
  options: {
    bar_color: {
      type: "array",
      label: "ステップの色",
      display: "color",
      default: ["#AA7777"] // 提供されたテーマカラー [cite: 5]
    },
    connector_color: {
      type: "array",
      label: "接続フローの色",
      display: "color",
      default: ["#E0D0D0"] // バーより薄い色
    },
    text_color: {
      type: "array",
      label: "テキストの色",
      display: "color",
      default: ["#333333"] // 提供されたテキスト色 [cite: 8]
    },
    show_dropoff: {
      type: "boolean",
      label: "離脱率を表示",
      default: true
    }
  },

  // 初期化処理 [cite: 198, 245]
  create: function(element, config) {
    // スタイルシートを追加（フォント設定など）
    element.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');
        .fashion-funnel-viz {
          font-family: 'Inter', sans-serif; /* 指定フォント [cite: 13] */
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        .step-label { font-size: 12px; font-weight: 600; }
        .step-value { font-size: 14px; font-weight: 400; }
        .dropoff-label { font-size: 10px; fill: #888; }
      </style>
    `;

    // D3描画用のコンテナを作成
    this.container = d3.select(element).append("div")
      .attr("class", "fashion-funnel-viz");

    this.svg = this.container.append("svg");
  },

  // 描画更新処理（データ変更時やリサイズ時に呼ばれます） [cite: 203, 259]
  updateAsync: function(data, element, config, queryResponse, details, done) {
    // エラーハンドリング [cite: 221]
    this.clearErrors();
    if (!data || data.length == 0) {
      this.addError({ title: "データなし", message: "データがありません。" });
      return;
    }

    // メジャー（数値項目）のみを取得し、最初の1行目のデータを使用します
    // ファネルは通常、集計された1つの結果を表示するためです
    const measures = queryResponse.fields.measure_like;
    if (measures.length < 1) {
      this.addError({ title: "設定エラー", message: "少なくとも1つのメジャーを選択してください。" });
      return;
    }

    const firstRow = data[0];

    // 描画用データの整形
    const funnelData = measures.map((field) => {
      const cell = firstRow[field.name];
      return {
        label: field.label_short || field.label, // 短いラベルを優先
        value: cell.value,
        rendered: LookerCharts.Utils.textForCell(cell), // フォーマット済みテキスト [cite: 315]
        links: cell.links, // ドリルダウン用リンク [cite: 358]
        color: cell.color // 条件付き書式があれば取得
      };
    });

    // 描画エリアのサイズ取得
    const width = element.clientWidth;
    const height = element.clientHeight;
    const margin = { top: 20, right: 20, bottom: 40, left: 20 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // SVGのリセットとサイズ設定
    this.svg.html("")
      .attr("width", width)
      .attr("height", height);

    const g = this.svg.append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // スケール設定（最大値を基準に幅を決める）
    const maxVal = d3.max(funnelData, d => d.value);
    const xScale = d3.scaleLinear()
      .domain([0, maxVal])
      .range([0, chartWidth * 0.8]); // 幅の80%を使用

    const stepHeight = chartHeight / funnelData.length;
    const barHeight = Math.min(stepHeight * 0.6, 50); // バーの太さ調整
    const gap = stepHeight - barHeight;

    // --- 描画ループ ---
    funnelData.forEach((d, i) => {
      const y = i * stepHeight;
      const barWidth = xScale(d.value);

      // 次のステップがある場合、接続フロー（台形のような曲線）を描画
      if (i < funnelData.length - 1) {
        const nextD = funnelData[i + 1];
        const nextBarWidth = xScale(nextD.value);
        const nextY = (i + 1) * stepHeight;

        const areaGenerator = d3.area()
          .x0(0) // 左端は揃える
          .x1(d => d.w)
          .y0(d => d.y)
          .y1(d => d.y)
          .curve(d3.curveBasis); // 滑らかな曲線にする

        // 接続パスの座標定義
        const pathData = [
          { x: 0, y: y + barHeight, w: barWidth }, // 現在のバーの下
          { x: 0, y: y + barHeight + gap * 0.5, w: barWidth * 0.9 }, // 中間点（少し絞る）
          { x: 0, y: nextY, w: nextBarWidth } // 次のバーの上
        ];

        // ベジェ曲線でカスタムパスを描画
        // 左上 -> 右上 -> 右下 -> 左下
        const path = d3.path();
        path.moveTo(0, y + barHeight); // Start Left
        path.bezierCurveTo(0, y + barHeight + gap/2, 0, nextY - gap/2, 0, nextY); // To Next Left
        path.lineTo(nextBarWidth, nextY); // To Next Right
        path.bezierCurveTo(nextBarWidth, nextY - gap/2, barWidth, y + barHeight + gap/2, barWidth, y + barHeight); // To Start Right
        path.closePath();

        g.append("path")
          .attr("d", path.toString())
          .attr("fill", config.connector_color[0] || "#E0D0D0")
          .attr("opacity", 0.6);

        // 離脱率・遷移率のテキスト表示
        if (config.show_dropoff) {
            const conversionRate = nextD.value / d.value;
            const dropRate = 1 - conversionRate;
            const pctText = (conversionRate * 100).toFixed(1) + "% 遷移";

            g.append("text")
             .attr("x", Math.max(barWidth, nextBarWidth) + 10)
             .attr("y", y + barHeight + gap / 2 + 4)
             .attr("fill", "#888")
             .style("font-size", "11px")
             .text(pctText);
        }
      }

      // メインのバー（角丸四角形）を描画
      const rect = g.append("rect")
        .attr("x", 0)
        .attr("y", y)
        .attr("width", barWidth)
        .attr("height", barHeight)
        .attr("rx", 6) // 角丸設定 [cite: 62] (24pxは大きすぎるため調整)
        .attr("fill", config.bar_color[0] || "#AA7777")
        .style("cursor", d.links ? "pointer" : "default"); // リンクがある場合はポインタ変更

      // ドリルダウンイベントの設定 [cite: 353, 372]
      rect.on("click", (event) => {
        if (d.links && d.links.length > 0) {
          LookerCharts.Utils.openDrillMenu({
            links: d.links,
            event: event
          });
        }
      });

      // ラベル（ステップ名）
      g.append("text")
        .attr("x", 5)
        .attr("y", y + barHeight / 2 - 2)
        .attr("class", "step-label")
        .attr("fill", "white") // 背景が濃い色なので白文字
        .attr("dominant-baseline", "middle")
        .text(d.label);

      // 値（数値）
      g.append("text")
        .attr("x", barWidth + 10)
        .attr("y", y + barHeight / 2)
        .attr("class", "step-value")
        .attr("fill", config.text_color[0] || "#333333")
        .attr("dominant-baseline", "middle")
        .text(d.rendered);
    });

    // 描画完了をLookerに通知 [cite: 303]
    done();
  }
});
