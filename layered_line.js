looker.plugins.visualizations.add({
  // 設定オプション
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
    },
    show_grid: {
      type: "boolean",
      label: "Show Grid Lines",
      default: true
    }
  },

  // セットアップ関数
  create: function(element, config) {
    element.innerHTML = `
      <style>
        .viz-container {
          display: flex;
          height: 100%;
          font-family: 'Inter', sans-serif;
          background-color: #ffffff;
          border-radius: 24px;
          overflow: hidden;
          padding: 16px;
          position: relative; /* Tooltip配置のため */
        }
        .chart-area {
          flex: 1;
          position: relative;
          overflow: visible; /* 軸ラベルが見切れないように */
        }
        .tabs-area {
          width: 140px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-left: 10px;
          justify-content: center;
          z-index: 10;
        }
        .tab {
          padding: 10px;
          background: #FAF9F8;
          border-radius: 0 12px 12px 0;
          cursor: pointer;
          font-size: 11px;
          color: #333333;
          transition: all 0.2s ease;
          border-left: 4px solid transparent;
          opacity: 0.7;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .tab.active {
          background: #fff;
          font-weight: 600;
          border-left: 4px solid #AA7777;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          opacity: 1.0;
          transform: scale(1.02);
          transform-origin: left center;
        }
        /* Tooltip Style */
        .looker-tooltip {
          position: absolute;
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid #AA7777;
          color: #333;
          padding: 8px 12px;
          border-radius: 8px;
          pointer-events: none;
          font-size: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          opacity: 0;
          transition: opacity 0.2s;
          z-index: 100;
          top: 0;
          left: 0;
        }
        .tooltip-header {
          font-weight: bold;
          margin-bottom: 4px;
          color: #AA7777;
          font-size: 11px;
        }
        /* 軸のスタイル */
        .axis text {
          font-family: 'Inter', sans-serif;
          color: #666;
          font-size: 10px;
        }
        .axis path, .axis line {
          stroke: #ddd;
        }
        .grid-line {
          stroke: #eee;
          stroke-dasharray: 4;
        }
      </style>
      <div class="viz-container">
        <div class="chart-area" id="chart"></div>
        <div class="tabs-area" id="tabs"></div>
        <div class="looker-tooltip" id="tooltip"></div>
      </div>
    `;
  },

  // 描画更新関数
  updateAsync: function(data, element, config, queryResponse, details, done) {
    this.clearErrors();

    // データ検証
    if (queryResponse.fields.dimensions.length == 0) {
      this.addError({ title: "No Dimensions", message: "1つのディメンションが必要です" });
      return;
    }
    if (queryResponse.fields.measures.length < 1) {
      this.addError({ title: "No Measures", message: "少なくとも1つのメジャーが必要です" });
      return;
    }

    // マージン設定（軸ラベル用に左を空ける）
    const margin = { top: 30, right: 20, bottom: 40, left: 60 };
    const chartContainer = element.querySelector("#chart");
    const width = chartContainer.clientWidth - margin.left - margin.right;
    const height = chartContainer.clientHeight - margin.top - margin.bottom;

    // 前回の描画をクリア
    const chartDiv = d3.select("#chart");
    chartDiv.selectAll("*").remove();
    const tabsDiv = d3.select("#tabs");
    tabsDiv.selectAll("*").remove();
    const tooltip = d3.select("#tooltip");

    // SVG初期化
    const svg = chartDiv.append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // データ準備
    const dimension = queryResponse.fields.dimensions[0];
    const measures = queryResponse.fields.measures;

    // アクティブなメジャーの管理
    if (typeof this.activeMeasureIndex === 'undefined') {
        this.activeMeasureIndex = 0;
    }
    // メジャー数が変わった場合の安全策
    if (this.activeMeasureIndex >= measures.length) {
        this.activeMeasureIndex = 0;
    }
    const activeMeasureIndex = this.activeMeasureIndex;

    // --- スケール設定 ---

    // X軸
    const x = d3.scalePoint()
      .range([0, width])
      .domain(data.map(d => LookerCharts.Utils.textForCell(d[dimension.name])))
      .padding(0.1);

    // アクティブなメジャーのY軸スケール
    const activeMeasure = measures[activeMeasureIndex];
    const yDomain = d3.extent(data, d => d[activeMeasure.name].value);
    // マージンを持たせて見やすくする (上下5%ほど余裕を)
    const yPadding = (yDomain[1] - yDomain[0]) * 0.05;
    const activeY = d3.scaleLinear()
        .range([height, 0])
        .domain([yDomain[0] - yPadding, yDomain[1] + yPadding]);

    // --- 軸とグリッドの描画 ---

    // X軸の描画
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .attr("class", "axis")
      .call(d3.axisBottom(x).tickSize(0).tickPadding(10))
      .selectAll("text")
      .style("text-anchor", "middle");

    // Y軸の描画（アクティブなメジャー用）
    const yAxis = d3.axisLeft(activeY)
        .ticks(5)
        .tickFormat(d => {
            // 簡易フォーマッター: 大きな数字をK, Mで表示
            return d3.format(".2s")(d);
        });

    // グリッド線の描画（オプション）
    if (config.show_grid !== false) {
        svg.append("g")
          .attr("class", "grid-line")
          .call(d3.axisLeft(activeY)
              .ticks(5)
              .tickSize(-width) // 横幅いっぱいに引く
              .tickFormat("")
          )
          .style("stroke-opacity", 0.3)
          .select(".domain").remove(); // 枠線は消す
    }

    // Y軸本体の描画
    svg.append("g")
      .attr("class", "axis")
      .call(yAxis)
      .select(".domain").remove(); // Y軸の縦棒も消してスッキリさせる

    // Y軸ラベル（メジャー名）
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left + 15)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "11px")
        .style("fill", config.line_color)
        .text(activeMeasure.label_short || activeMeasure.label);


    // --- タブ（インデックス）の生成 ---
    measures.slice(0, 5).forEach((m, i) => {
      tabsDiv.append("div")
        .attr("class", `tab ${i === activeMeasureIndex ? 'active' : ''}`)
        .text(m.label_short || m.label)
        .on("click", () => {
          this.activeMeasureIndex = i;
          this.trigger('updateConfig', [{_force_redraw: Date.now()}]);
        });
    });

    // --- グラフの描画 ---

    // レイヤー順序: アクティブを最後に（最前面に）
    const sortedIndices = measures.map((_, i) => i).filter(i => i !== activeMeasureIndex);
    sortedIndices.push(activeMeasureIndex);

    sortedIndices.forEach(i => {
        const measure = measures[i];
        const isActive = (i === activeMeasureIndex);

        // 各メジャーごとのYスケール（描画用）
        const measureExtent = d3.extent(data, d => d[measure.name].value);
        const mPadding = (measureExtent[1] - measureExtent[0]) * 0.05;
        const measureY = d3.scaleLinear()
            .range([height, 0])
            .domain([measureExtent[0] - mPadding, measureExtent[1] + mPadding]);

        const lineGen = d3.line()
            .x(d => x(LookerCharts.Utils.textForCell(d[dimension.name])))
            .y(d => measureY(d[measure.name].value))
            .curve(d3.curveMonotoneX);

        // Path（線）
        const path = svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", isActive ? config.line_color : config.background_color)
            .attr("stroke-width", isActive ? 3 : 5) // 非アクティブはクリックしやすいよう太く透明度を下げる
            .attr("stroke-opacity", isActive ? 1 : 0.0) // 透明なヒットエリアを作るため一旦0に
            .attr("d", lineGen)
            .style("cursor", isActive ? "default" : "pointer");

        // 非アクティブな線の「見える」部分（細い線）
        if (!isActive) {
            svg.append("path")
                .datum(data)
                .attr("fill", "none")
                .attr("stroke", config.background_color)
                .attr("stroke-width", 1.5)
                .attr("stroke-opacity", 0.5)
                .attr("d", lineGen)
                .style("pointer-events", "none"); // クリックは太い透明な線で拾う

            // 非アクティブな線（透明な太い線）をクリックした時の挙動
            path.attr("stroke-opacity", 0) // 完全透明
                .on("click", () => {
                    this.activeMeasureIndex = i;
                    this.trigger('updateConfig', [{_force_redraw: Date.now()}]);
                })
                .append("title").text(`Click to show ${measure.label}`); // ブラウザ標準ツールチップ
        } else {
             // アクティブな線はそのまま表示
             path.style("filter", "drop-shadow(0px 4px 6px rgba(170, 119, 119, 0.3))");
        }

        // データポイントとTooltip（アクティブな線のみ）
        if (isActive) {
           svg.selectAll(`.dot-${i}`)
             .data(data)
             .enter().append("circle")
             .attr("cx", d => x(LookerCharts.Utils.textForCell(d[dimension.name])))
             .attr("cy", d => measureY(d[measure.name].value))
             .attr("r", 6) // 少し大きく
             .attr("fill", "#fff")
             .attr("stroke", config.line_color)
             .attr("stroke-width", 2)
             .style("cursor", "pointer")
             // Crossfilter
             .on("click", function(event, d) {
                if (details.crossfilterEnabled) {
                  LookerCharts.Utils.toggleCrossfilter({row: d, event: event});
                }
             })
             // Tooltip Events
             .on("mouseover", function(event, d) {
                 const mousePos = d3.pointer(event, document.body); // 絶対座標取得
                 const val = LookerCharts.Utils.textForCell(d[measure.name]);
                 const dimVal = LookerCharts.Utils.textForCell(d[dimension.name]);

                 // Tooltip位置調整（viz-containerに対する相対配置）
                 // event.pageX/Y だとiframe内座標でズレることがあるので、
                 // 親要素からの相対位置計算が安全ですが、簡易的にd3.pointerを使用
                 const [mx, my] = d3.pointer(event, element.querySelector('.viz-container'));

                 tooltip
                    .style("opacity", 1)
                    .html(`
                        <div class="tooltip-header">${dimVal}</div>
                        <div>${measure.label}: <b>${val}</b></div>
                    `)
                    .style("left", (mx + 10) + "px")
                    .style("top", (my - 10) + "px");

                 d3.select(this)
                   .attr("r", 8)
                   .attr("fill", config.line_color); // ホバー時に中を塗りつぶす
             })
             .on("mouseout", function() {
                 tooltip.style("opacity", 0);
                 d3.select(this)
                   .attr("r", 6)
                   .attr("fill", "#fff");
             });
        }
    });

    done();
  }
});
