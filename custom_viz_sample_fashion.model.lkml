connection: "tanaka_connect"

include: "/views/*.view.lkml"
label: "fashion"
# explore: products {
#   join: orders {
#     type: left_outer
#     relationship: one_to_many
#     sql_on: ${products.id} = ${orders.product_id} ;;
#     }
#}
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
