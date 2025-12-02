view: orders {
  sql_table_name: `looker-428505.fashion.orders` ;;

  dimension: amount {
    type: number
    sql: ${TABLE}.amount ;;
  }
  measure: total_amont {
    type: sum
    sql: ${amount} ;;
    value_format_name: usd
  }
  dimension: product_name {
    type: string
    sql: ${TABLE}.product_name ;;
  }
  dimension_group: purchase {
    type: time
    timeframes: [raw, date, week, month,month_num, quarter, year]
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
  dimension: review_content {
    type: string
    sql: ${TABLE}.review_content ;;
  }
  dimension: review_rating {
    type: number
    sql: ${TABLE}.review_rating ;;
  }
  measure: ave_review_rating {
    type: average
    sql: ${review_rating} ;;
    value_format_name: decimal_1
  }
  measure: total_review_rating {
    type: sum
    sql: ${review_rating} ;;
    value_format_name: decimal_1
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
  measure: count {
    type: count
    drill_fields: [product_name]
  }
}
