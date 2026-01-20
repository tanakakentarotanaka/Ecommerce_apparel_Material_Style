connection: "tanaka_connect"

include: "/views/*.view.lkml"
label: "EC"

explore: orders {
  join: products {
    type: left_outer
    relationship: many_to_one
    sql_on: ${orders.product_id} = ${products.id} ;;
  }
  join: web_performance_log {
    type: left_outer
    relationship: many_to_one
    sql_on: ${orders.product_id} = ${web_performance_log.product_id}
      and ${orders.purchase_month} = ${web_performance_log.date_month};;
  }
}

explore: test{
}
