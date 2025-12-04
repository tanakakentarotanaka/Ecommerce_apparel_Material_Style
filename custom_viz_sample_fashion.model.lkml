connection: "tanaka_connect"

include: "/views/*.view.lkml"
label: "fashion"
explore: products {
  join: orders {
    type: left_outer
    relationship: one_to_many
    sql_on: ${products.id} = ${orders.product_id} ;;
    }
}
