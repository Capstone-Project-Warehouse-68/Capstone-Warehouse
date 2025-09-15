export interface ProductInterface {
    ProductName: string;
    ProductCode: string;
    SupplyProductCode: string;
    ManufacturerCode?: string;
    Description: string;
    Quantity: number;
    UnitPerQuantityID: number;
    PricePerPiece?: number;
    Discount?: number;
    SumPriceProduct: number;
    SalePrice: number;
    CategoryID: number;
    Zone: number;
    ShelfID: number;
}

export interface BillInterface {
    ID: number,
    Title?: string,
    SupplyID?: number,
    Supply?: {
        SupplyName?: string
    },
    DateImport?: Date,
    SummaryPrice?: Float32Array,
    EmployeeID?: number,
    Employee?: {
        FirstName?: string;
        LastName?: string;
    }
    products: ProductInterface[];

}