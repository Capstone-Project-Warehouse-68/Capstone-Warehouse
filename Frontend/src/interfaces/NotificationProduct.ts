export interface NotificationProduct {
  product_id: number;
  product_name: string;
  product_code: string;
  supplier_name: string;
  product_created_at: string;
  limit_quantity: number;
  unit_per_quantity: string;
}

export interface UpdateNotificationProduct {
  product_id: number;   
  limit_quantity: number;
}