export interface ProductItem {
  ID: number;
  ProductCode: string;
  ProductName: string;
  Quantity: number;
  NameOfUnit: string;
  SupplyProductCode: string;
  SupplyName: string;
  Shelf: string;
  Zone: string;
  CreatedAt: string; 
  Description: string;
CategoryName: string;
}

export interface ProductPDF {
  id: number;
  product_code: string;
  product_name: string;
  quantity: number;
  name_of_unit: string;
  supply_name: string;
  date_import: string; 
  category_name: string;
}
