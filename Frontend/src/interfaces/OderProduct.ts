// type ของ Product ที่จะส่งไป
export interface OrderProductInput {
  product_id: number;
  unit_per_quantity_id: number;
  quantity: number;
}

// type ของ OrderBill
export interface OrderBillInput {
  supply_id: number;
  employee_id: number;
  description: string;
  products: OrderProductInput[];
}

export interface MultiOrderBillInput {
  employee_id: number;
  orders: OrderBillInput[];
}
