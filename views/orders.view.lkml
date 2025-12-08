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

    # --- ここからアクション定義 ---
    action: {
      label: "📦 再入荷をリクエスト"
      url: "https://example.com/dummy_endpoint" # 実際には送信されませんが、フォーム表示のために必要です
      icon_url: "https://looker.com/favicon.ico"

      # フォームの入力項目定義
      form_param: {
        name: "quantity"
        type: string
        label: "入荷希望数"
        default: "10"
        required: yes
      }

      form_param: {
        name: "priority"
        type: select
        label: "優先度"
        option: { label: "通常"}
        option: { label: "至急 (High)" }
        default: "normal"
      }

      form_param: {
        name: "note"
        type: textarea
        label: "バイヤーへの備考"
        required: no
      }
    }
    # --- ここまで ---
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
