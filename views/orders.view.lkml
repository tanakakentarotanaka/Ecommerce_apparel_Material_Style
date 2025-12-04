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
  dimension: order_month_name_short {
    group_label: "purchase"
    label: "Order Month Name (Short)" # チャート上のラベルも分かりやすく変更

    # 元のmonth_nameを参照（これで裏側のソート用データ |FIELD|9 は維持されます）
    sql: ${purchase_month_name} ;;

    # 1. '|' で区切って前の部分（月名）を取得
    # 2. 'slice: 0, 3' で先頭の3文字だけを切り出す (September -> Sep)
    html: {{ value | split: '|' | first | slice: 0, 3 }} ;;
    order_by_field: purchase_date
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

  measure: total_purchase_price {
    type: sum
    sql: ${purchase_price} ;;
  }

  measure: average_purchase_price {
    type: average
    sql: ${purchase_price} ;;
  }
}
