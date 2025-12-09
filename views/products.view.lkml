view: products {
  sql_table_name: `looker-428505.fashion.products` ;;
  drill_fields: [id]

  dimension: id {
    primary_key: yes
    type: number
    sql: ${TABLE}.ID ;;
  }
  dimension: inventory {
    type: number
    sql: ${TABLE}.Inventory ;;
  }
  measure: total_inventory {
    type: sum
    sql: ${inventory};;
  }
  dimension: inventory_status {
    type: string
    sql: ${TABLE}.InventoryStatus ;;
  }
  dimension: price {
    type: number
    sql: ${TABLE}.Price ;;
    value_format: "€####"
  }
  dimension: price_tier {
    label: "Price Tier(€)"
    type: tier
    tiers: [0,500,1000,1500,2000,3000]
    style: integer
    sql: ${price} ;;
  }
  measure: total_price {
    type: sum
    sql: ${price} ;;
    value_format_name: eur_0
  }
  dimension: category {
    type: string
    sql: ${TABLE}.category ;;
  }
  dimension: color {
    type: string
    sql: ${TABLE}.color ;;
  }
  dimension: color_category {
    type: string
    sql: ${TABLE}.Color_category ;;
  }

  dimension: gender {
    type: string
    sql:${TABLE}.gender ;;
  }
  dimension: size {
    type: string
    sql: ${TABLE}.size;;
  }
  dimension: product_image_url {
    type: string
    sql: ${TABLE}.ProductImageURL ;;
  }
  dimension: product_name {
    type: string
    sql: ${TABLE}.ProductName ;;
  }
  measure: count {
    label: "Product Count"
    type: count
    drill_fields: [id, product_name]
  }
}
