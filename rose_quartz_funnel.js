/**
 * Rose Quartz Funnel for Looker
 * * テーマカラー #AA7777 をベースにした、ファッションBI向けの上品なファネルチャート。
 * 検索 -> PV -> カート -> 購入 のような遷移と離脱率を可視化します。
 */

looker.plugins.visualizations.add({
  // 設定オプション：ユーザーが編集画面で変更できる項目 [cite: 114, 285]
  options: {
    bar_color: {
      type: "string",
      label: "バーの色 (Bar Color)",
      display: "color",
      default: "#AA7777" // Rose Quartz Theme Color
    },
    label_color: {
      type: "string",
      label: "ラベルの色 (Text Color)",
      display: "color",
      default: "#333333" // Theme Text Color [cite: 8, 39]
    },
    font_size: {
      type: "number",
      label: "フォントサイズ",
      default: 14,
      display: "range",
      min: 10,
      max: 30
    }
  },

  // ビジュアライゼーションの初期化 [cite: 101]
  create: function(element, config) {
    element.innerHTML = "";

    // D3.jsのコンテナを作成
    this.container = d3.select(element)
      .append("svg")
      .attr("width", "100%")
      .attr("height", "100%");

    // スタイル定義（フォントはテーマに合わせる）
    element.style.fontFamily = "'Inter', 'sans-serif', 'Open Sans', Helvetica, Arial, sans-serif"; [cite: 13]
  },

  // データの描画・更新 [cite: 106, 163]
  updateAsync: function(data, element, config, queryResponse, details, done) {

    // エラーハンドリング [cite: 124]
    this.clearErrors();
    if (queryResponse.fields.dimensions.length === 0 || queryResponse.fields.measures.length === 0) {
      this.addError({title: "データ不足", message: "このチャートには、1つのディメンション（ステップ名）と1つのメジャー（人数）が必要です。"});
      return;
    }

    const margin = { top: 20, right: 100, bottom: 20, left: 120 };
    const width = element.clientWidth - margin.left - margin.right;
    const height = element.clientHeight - margin.top - margin.bottom;

    // SVGのサイズ更新
    const svg = this.container
      .attr("width", element.clientWidth)
      .attr("height", element.clientHeight);

    // 以前の描画内容をクリア
    svg.selectAll("*").remove();

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // データの整形
    const dimensionName = queryResponse.fields.dimensions[0].name;
    const measureName = queryResponse.fields.measures[0].name;

    // データセットの最大値を取得（スケール計算用）
    const maxVal = d3.max(data, d => d[measureName].value);

    // スケール設定
    const x = d3.scaleLinear().domain([0, maxVal]).range([0, width]);
    const y = d3.scaleBand().domain(data.map(d => d[dimensionName].value)).range([0, height]).padding(0.3);

    // バーの描画
    const bars = g.selectAll(".bar")
      .data(data)
      .enter()
      .append("g")
      .attr("class", "bar-group")
      .attr("transform", d => `translate(0, ${y(d[dimensionName].value)})`);

    // クロスフィルタリングの状態チェック関数 [cite: 242]
    const getOpacity = (d) => {
      if (!details.crossfilterEnabled) return 1.0;
      const selection = LookerCharts.Utils.getCrossfilterSelection(d[dimensionName]);
      // 選択なし(0)または選択中(1)なら不透明、非選択(2)なら薄くする
      return selection === 2 ? 0.2 : 1.0;
    };

    // 1. バー本体（角丸の長方形で上品さを演出）
    bars.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", d => x(d[measureName].value))
      .attr("height", y.bandwidth())
      .attr("rx", 6) // 角を丸くする [cite: 63] (参考画像の雰囲気に合わせる)
      .attr("ry", 6)
      .attr("fill", config.bar_color || "#AA7777") [cite: 5]
      .style("opacity", d => getOpacity(d))
      .style("cursor", details.crossfilterEnabled ? "pointer" : "default")
      // クリックイベント（クロスフィルタ） [cite: 228]
      .on("click", (event, d) => {
        if (details.crossfilterEnabled) {
          LookerCharts.Utils.toggleCrossfilter({
            row: d,
            event: event,
          });
        }
      });

    // 2. 左側のラベル（ステップ名）
    bars.append("text")
      .attr("x", -10)
      .attr("y", y.bandwidth() / 2)
      .attr("dy", ".35em")
      .attr("text-anchor", "end")
      .text(d => LookerCharts.Utils.textForCell(d[dimensionName])) [cite: 218]
      .attr("fill", config.label_color || "#333333") [cite: 8]
      .style("font-size", `${config.font_size}px`)
      .style("font-weight", "500");

    // 3. 右側の数値（人数）
    bars.append("text")
      .attr("x", d => x(d[measureName].value) + 10)
      .attr("y", y.bandwidth() / 3)
      .attr("dy", ".35em")
      .text(d => LookerCharts.Utils.textForCell(d[measureName]))
      .attr("fill", config.label_color || "#333333")
      .style("font-size", `${config.font_size}px`)
      .style("font-weight", "bold");

    // 4. 遷移率・離脱率の計算と表示
    // ループ処理で前のデータと比較する
    bars.each(function(d, i) {
      if (i > 0) {
        const currentVal = d[measureName].value;
        const prevVal = data[i-1][measureName].value;

        // 残存率（Next Rate）
        const retentionRate = prevVal > 0 ? (currentVal / prevVal * 100).toFixed(1) + "%" : "-";

        d3.select(this).append("text")
          .attr("x", x(d[measureName].value) + 10)
          .attr("y", y.bandwidth() / 1.5 + 5)
          .attr("dy", ".35em")
          .attr("fill", "#888") // 補助テキストは少し薄く
          .style("font-size", `${Math.max(10, config.font_size - 2)}px`)
          .text(`Next: ${retentionRate}`);
      } else {
         // 最初のステップ
         d3.select(this).append("text")
          .attr("x", x(d[measureName].value) + 10)
          .attr("y", y.bandwidth() / 1.5 + 5)
          .attr("dy", ".35em")
          .attr("fill", "#888")
          .style("font-size", `${Math.max(10, config.font_size - 2)}px`)
          .text(`Start`);
      }
    });

    // 処理完了を通知 [cite: 207]
    done();
  }
});
