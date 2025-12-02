looker.plugins.visualizations.add({
  // 設定オプションの定義 [cite: 317]
  options: {
    line_color: {
      type: "string",
      label: "Active Line Color",
      display: "color",
      default: "#AA7777" // Rose Quartz
    },
    background_color: {
      type: "string",
      label: "Background Line Color",
      display: "color",
      default: "#D3CCC6" // Muted Gray/Beige
    }
  },

  // セットアップ関数 [cite: 134]
  create: function(element, config) {
    element.innerHTML = `
      <style>
        .viz-container {
          display: flex;
          height: 100%;
          font-family: 'Inter', sans-serif;
          background-color: #ffffff; /* Tile Background */
          border-radius: 24px; /* Theme Radius */
          overflow: hidden;
          padding: 16px;
        }
        .chart-area {
          flex: 1;
          position: relative;
        }
        .tabs-area {
          width: 120px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-left: 16px;
          justify-content: center;
        }
        .tab {
          padding: 10px;
          background: #FAF9F8;
          border-radius: 0 12px 12px 0;
          cursor: pointer;
          font-size: 12px;
          color: #333333;
          transition: all 0.3s ease;
          border-left: 4px solid transparent;
          opacity: 0.7;
        }
        .tab.active {
          background: #fff;
          font-weight: bold;
          border-left: 4px solid #AA7777;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          opacity: 1.0;
        }
        .tooltip {
          position: absolute;
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid #AA7777;
          padding: 8px;
          border-radius: 8px;
          pointer-events: none;
          font-size: 11px;
          display: none;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
      </style>
      <div class="viz-container">
        <div class="chart-area" id="chart"></div>
        <div class="tabs-area" id="tabs"></div>
      </div>
    `;
  },

  // 描画更新関数 (非同期推奨) [cite: 196]
  updateAsync: function(data, element, config, queryResponse, details, done) {
    // エラーハンドリング [cite: 157]
    this.clearErrors();
    if (queryResponse.fields.dimensions.length == 0) {
      this.addError({ title: "No Dimensions", message: "1つのディメンションが必要です" });
      return;
    }
    if (queryResponse.fields.measures.length < 1) {
      this.addError({ title: "No Measures", message: "少なくとも1つのメジャーが必要です" });
      return;
    }

    const margin = { top: 20, right: 20, bottom: 30, left: 20 };
    const width = element.querySelector("#chart").clientWidth - margin.left - margin.right;
    const height = element.querySelector("#chart").clientHeight - margin.top - margin.bottom;

    // 前回の描画をクリア
    const chartDiv = d3.select("#chart");
    chartDiv.selectAll("*").remove();
    const tabsDiv = d3.select("#tabs");
    tabsDiv.selectAll("*").remove();

    // SVGの作成
    const svg = chartDiv.append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // データ処理
    const dimension = queryResponse.fields.dimensions[0];
    const measures = queryResponse.fields.measures;

    // 初期の選択メジャー（一番最初のもの）
    let activeMeasureIndex = this.activeMeasureIndex || 0;

    // X軸スケール (Time or Ordinal)
    const x = d3.scalePoint()
      .range([0, width])
      .domain(data.map(d => LookerCharts.Utils.textForCell(d[dimension.name]))) // [cite: 251]
      .padding(0.1);

    // インデックス(タブ)の作成
    measures.slice(0, 5).forEach((m, i) => { // 最大5つまで
      const tab = tabsDiv.append("div")
        .attr("class", `tab ${i === activeMeasureIndex ? 'active' : ''}`)
        .text(m.label_short || m.label)
        .on("click", () => {
          this.activeMeasureIndex = i;
          this.trigger('updateConfig', [{_force_redraw: Date.now()}]); // 再描画トリガー
        });
    });

    // 線の描画関数ジェネレーター
    // 各メジャーごとにY軸スケールを独立させる（0-100%の高さに正規化）
    const getLineGenerator = (measureName) => {
        const yDomain = d3.extent(data, d => d[measureName].value);
        const y = d3.scaleLinear().range([height, 0]).domain(yDomain);
        return d3.line()
            .x(d => x(LookerCharts.Utils.textForCell(d[dimension.name])))
            .y(d => y(d[measureName].value))
            .curve(d3.curveMonotoneX); // 滑らかな曲線
    };

    // レイヤー順序の制御: アクティブなものを最後に描画（最前面）
    const sortedIndices = measures.map((_, i) => i).filter(i => i !== activeMeasureIndex);
    sortedIndices.push(activeMeasureIndex);

    sortedIndices.forEach(i => {
        const measure = measures[i];
        const isActive = (i === activeMeasureIndex);

        // パスの描画
        svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", isActive ? config.line_color : config.background_color)
            .attr("stroke-width", isActive ? 3 : 1.5)
            .attr("stroke-opacity", isActive ? 1 : 0.4) // 背景は薄く
            .attr("d", getLineGenerator(measure.name))
            .style("filter", isActive ? "drop-shadow(0px 4px 6px rgba(170, 119, 119, 0.3))" : "none");

        // データポイント（クロスフィルター用）
        if (isActive) {
           const yDomain = d3.extent(data, d => d[measure.name].value);
           const y = d3.scaleLinear().range([height, 0]).domain(yDomain);

           svg.selectAll(`.dot-${i}`)
             .data(data)
             .enter().append("circle")
             .attr("cx", d => x(LookerCharts.Utils.textForCell(d[dimension.name])))
             .attr("cy", d => y(d[measure.name].value))
             .attr("r", 5)
             .attr("fill", "#fff")
             .attr("stroke", config.line_color)
             .attr("stroke-width", 2)
             .style("cursor", "pointer")
             .on("click", function(event, d) {
                // クロスフィルタートグル
                if (details.crossfilterEnabled) {
                  LookerCharts.Utils.toggleCrossfilter({
                    row: d,
                    event: event,
                  });
                }
             })
             .on("mouseover", function(event, d) {
                 // ツールチップ表示など（省略）
             });
        }
    });

    // 描画完了通知 [cite: 240]
    done();
  }
});
