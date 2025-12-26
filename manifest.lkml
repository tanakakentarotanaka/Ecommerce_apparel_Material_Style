project_name: "custom_viz_sample_fasion"


#Published https://github.com/tanakakentarotanaka/looker-viz-library/tree/main/advanced_cross_filtering
visualization: {
  id: "custom-advanced-cross-filter-for-ec"
  label: "by Gemini TMP| Apparel EC Advanced Cross Filter"
  file: "custom_viz/advanced_cross_filtering_for_ec.js"
}

visualization: {
  id: "fashion_bi_curved_slope"
  label: "by Gemini TMP| Apparel EC Curve Slope"
  file: "custom_viz/curved_slope.js"
  dependencies: ["https://d3js.org/d3.v7.min.js"]
}

visualization: {
  id: "hero_video_menu"
  label: "by Gemini TMP| Apparel EC Hero Video Menu "
  file: "custom_viz/hero_video_menu.js"
}

visualization: {
  id: "product_catalog_grid"
  label: "by Gemini TMP| Apparel EC Product Catalog Grid"
  file: "custom_viz/product_catalog.js"
}

visualization: {
  id: "review_distribution_chart"
  label: "by Gemini TMP| Apparel EC Review Distribution Chart"
  file: "custom_viz/review_distribution.js"
}

visualization: {
  id: "review_list_view"
  label: "by Gemini TMP| Apparel EC Review List"
  file: "custom_viz/review_list.js"
}

visualization:{
  id: "runway_layered_line"
  label: "by Gemini TMP| Apparel EC Layered Line"
  file: "custom_viz/layered_line.js"
  dependencies: ["https://d3js.org/d3.v7.min.js"]
}

visualization: {
  id: "fashion_bi_funnel"
  label: "by Gemini TMP|Apparel EC BI funnel"
  file: "custom_viz/fashion_funnel.js"
  dependencies: ["https://d3js.org/d3.v7.min.js"]
}

visualization: {
  id: "status_filter_button"
  label: "by Gemini TMP| Apparel EC Status Filter Button"
  file: "custom_viz/status_button.js"
}

visualization: {
  id: "gmp_style_3ring_chart"
  label: "by Gemini TMP| Looker Icon Viz"
  file: "custom_viz/looker_icon_viz.js"
  dependencies: ["https://d3js.org/d3.v7.min.js"]
}
