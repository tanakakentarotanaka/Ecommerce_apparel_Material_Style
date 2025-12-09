project_name: "custom_viz_sample_fasion"

# Custom Visualizationの登録
visualization: {
  id: "rose_quartz_funnel"
  label: "by Gemini TMP| Quartz Funnel"
  file: "rose_quartz_funnel.js"

  # D3.js (v7) を外部ライブラリとして読み込み [cite: 94]
  dependencies: ["https://d3js.org/d3.v7.min.js"]
}

visualization: {
  id: "fashion_bi_curved_slope"
  label: "by Gemini TMP| Fashion Curve Slope"
  file: "curved_slope.js"
  dependencies: ["https://d3js.org/d3.v7.min.js"]
}


visualization: {
  id: "hero_video_menu"
  label: "by Gemini TMP| Fashion Hero Video Menu "
  file: "hero_video_menu.js"
}

visualization: {
  id: "product_catalog_grid"
  label: "by Gemini TMP| Fashion Product Catalog Grid"
  file: "product_catalog.js"
}

visualization: {
  id: "review_distribution_chart"
  label: "by Gemini TMP| Fashion Review Distribution Chart"
  file: "review_distribution.js"
}

visualization: {
  id: "review_list_view"
  label: "by Gemini TMP| Fashion Review List"
  file: "review_list.js"
}

visualization: {
  id: "status_filter_button"
  label: "by Gemini TMP| Fashion Status Filter Button"
  file: "status_button.js"
}

visualization:{
  id: "runway_layered_line"
  label: "by Gemini TMP| Fashion Runway Layered Line"
  file: "layered_line.js"
  dependencies: ["https://d3js.org/d3.v7.min.js"]
}
