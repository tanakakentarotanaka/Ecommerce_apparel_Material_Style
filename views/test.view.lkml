view: test {
  sql_table_name: `looker-428505.fashion.test` ;;
  drill_fields: [id]

  dimension: id {
    primary_key: yes
    type: number
    sql: ${TABLE}.ID ;;
  }
  dimension: cate_1 {
    type: string
    sql: ${TABLE}.cate_1 ;;
  }
  dimension: cate_2 {
    type: string
    sql: ${TABLE}.cate_2 ;;
  }
  dimension: cate_3 {
    type: string
    sql: ${TABLE}.cate_3 ;;
  }
  dimension: value {
    type: number
    sql: ${TABLE}.value ;;
  }
  measure: value_total {
    type: sum
    sql: ${value} ;;
  }
  measure: count {
    type: count
    drill_fields: [id]
  }
}
