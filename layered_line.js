    options: {
      // ... (既存のオプション) ...

      index_font_size: {
        type: "string",
        label: "Index Font Size",
        default: "11px",
        placeholder: "e.g. 12px, 0.9rem",
        section: "Style",
        order: 5
      },
      // ★ ここに追加: 凡例エリアの幅を指定するオプション ★
      legend_width: {
        type: "number",
        label: "Legend Width (px)",
        default: 0,
        placeholder: "Set 0 for Auto (e.g. 200)",
        section: "Style",
        order: 6
      },

      // ... (Box Model & Shadow Section へ続く) ...
