view: orders {
  sql_table_name: `looker-428505.fashion.orders` ;;

  dimension: product_id {
    type: number
    sql: ${TABLE}.product_id ;;
  }
  dimension_group: purchase {
    type: time
    timeframes: [raw, date, week, month, quarter, year]
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
  dimension: prchase_price {
    type: number
    sql: ${TABLE}.prchase_price ;;
  }
  measure: count {
    type: count
  }

  measure: total_product_id {
    type: sum
    sql: ${product_id} ;;
  }

  measure: average_product_id {
    type: average
    sql: ${product_id} ;;
  }

  measure: total_review_rating {
    type: sum
    sql: ${review_rating} ;;
  }

  measure: average_review_rating {
    type: average
    sql: ${review_rating} ;;
  }

  measure: total_transaction_id {
    type: sum
    sql: ${transaction_id} ;;
  }

  measure: average_transaction_id {
    type: average
    sql: ${transaction_id} ;;
  }

  measure: total_user_id {
    type: sum
    sql: ${user_id} ;;
  }

  measure: average_user_id {
    type: average
    sql: ${user_id} ;;
  }

  measure: total_purchase_price {
    type: sum
    sql: ${prchase_price} ;;
  }

  measure: average_purchase_price {
    type: average
    sql: ${prchase_price} ;;
  }

}
