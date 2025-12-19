# I have also added information other than web performance, such as weather.

view: web_performance_log {
  sql_table_name: `looker-428505.fashion.web_performance_log` ;;
  dimension: id {
    primary_key: yes
    type: number
    sql: ${TABLE}.id ;;
  }
  dimension_group: date {
    type: time
    timeframes: [month, quarter, year]
    convert_tz: no
    datatype: date
    sql: ${TABLE}.date ;;
  }
  dimension: dom_content_loaded {
    type: number
    sql: ${TABLE}.dom_content_loaded ;;
  }
  measure: ave_dom_content_loaded {
    type: average
    sql: ${dom_content_loaded} ;;
  }
  dimension: page_load_time {
    type: number
    sql: ${TABLE}.page_load_time ;;
  }
  measure:  ave_page_load_time{
    type: average
    sql: ${page_load_time} ;;
  }
  dimension: product_id {
    type: number
    sql: ${TABLE}.product_id ;;
  }
  dimension: time_to_interactive {
    type: number
    sql: ${TABLE}.time_to_interactive ;;
  }
  measure: ave_time_to_interactive{
    type: average
    sql: ${time_to_interactive} ;;
  }
  dimension: temperature {
    label: "ave_temperature"
    type: number
    sql: ${TABLE}.average_temperature ;;
  }
  measure:  ave_temperature{
    type: average
    sql: ${temperature} ;;

  }
  dimension: search_trend_score {
    type: number
    sql: ${TABLE}.search_trend_score ;;
  }
  measure: ave_search_trend_score {
    type: average
    sql: ${search_trend_score} ;;
  }
  dimension: page_views {
    type: number
    sql: ${TABLE}.page_views ;;
  }
  measure: ave_page_views {
    type: average
    sql: ${page_views} ;;
  }
  measure: count {
    type: count
  }
}
