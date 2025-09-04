// รายการสินค้าในใบสั่งซื้อ
export interface OrderProduct {
  product_id: number;
  product_name: string;
  unit_per_quantity_id: number;
  unit_name: string;
  quantity: number;
  supply_product_code : string;
  category_name: string;

}

// ใบสั่งซื้อ
export interface OrderBill {
  order_bill_id: number;
  updated_at: string; 
  description: string;
  supply_id: number;
  supply_name: string;
  products: OrderProduct[];
}


