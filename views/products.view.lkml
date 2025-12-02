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
  dimension: inventory_status {
    type: string
    sql: ${TABLE}.InventoryStatus ;;
  }
  dimension: price {
    type: number
    sql: ${TABLE}.Price ;;
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
    type: count
    drill_fields: [id, product_name]
  }
}
