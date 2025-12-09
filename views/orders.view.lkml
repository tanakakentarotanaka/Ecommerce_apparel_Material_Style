view: orders {
  sql_table_name: `looker-428505.fashion.orders` ;;

  dimension: product_id {
    type: number
    sql: ${TABLE}.product_id ;;
  }

  dimension_group: purchase {
    type: time
    timeframes: [raw, date, week, month, month_name,quarter, year]
    convert_tz: no
    datatype: date
    sql: ${TABLE}.purchase_date ;;
  }

  dimension: return_status {
    type: string
    sql: ${TABLE}.return_status ;;
  }

  dimension: review {
    type: string
    sql: ${TABLE}.review ;;
  }
  dimension: review_rating {
    type: number
    sql: ${TABLE}.review_rating ;;
  }
  dimension: transaction_id {
    primary_key: yes
    type: number
    sql: ${TABLE}.transaction_id ;;
  }
  dimension: user_age_group {
    type: string
    sql: ${TABLE}.user_age_group ;;
  }
  dimension: user_gender {
    type: string
    sql: ${TABLE}.user_gender ;;
  }
  dimension: user_id {
    type: number
    sql: ${TABLE}.user_id ;;
  }
  dimension: purchase_price {
    type: number
    sql: ${TABLE}.purchase_price ;;
  }
  dimension: category {
    label: "review_category"
    type: number
    sql: ${TABLE}.category ;;
  }

  measure: count {
    type: count
  }

  measure: total_review_rating {
    type: sum
    sql: ${review_rating} ;;
  }

  measure: average_review_rating {
    type: average
    sql: ${review_rating} ;;
    value_format: "#,##0.00"
  }

  measure: total_purchase_price {
    type: sum
    sql: ${purchase_price} ;;
  }

  measure: average_purchase_price {
    type: average
    sql: ${purchase_price} ;;
  }
}
