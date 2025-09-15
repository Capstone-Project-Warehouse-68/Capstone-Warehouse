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
export interface  ProductsDraft{
    supply_draft_name: string;
    product_draft_name: string;
    category_name: string;
    unit_draf_name: string;
    quantity: number;
}

// ใบสั่งซื้อ
export interface OrderBill {
  order_bill_id: number;
  updated_at: string; 
  description: string;
  supply_id: number;
  supply_name: string;
  products: OrderProduct[];
  products_draft: ProductsDraft[];
}


