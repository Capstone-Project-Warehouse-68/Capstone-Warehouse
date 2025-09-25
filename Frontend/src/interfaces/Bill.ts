export interface ProductInterface {
    ID: number;
    ProductName: string;
    ProductCode: string;
    SupplyProductCode: string;
    ManufacturerCode?: string;
    Description: string;
    Quantity: number;
    UnitPerQuantityID: number;
    NameOfUnit: string;
    PricePerPiece: number;
    Discount?: number;
    SumPriceProduct: number;
    SalePrice: number;
    CategoryID: number;
    CategoryName: string;
    Zone: number;
    ZoneName: string;  
    ShelfID: number;
    ShelfName: string;
}

export interface BillInterface {
    ID: number,
    Title?: string,
    SupplyName?: string,
    SupplyID?: number,
    Supply?: {
        SupplyName?: string
    },
    DateImport?: Date,
    SummaryPrice?: Float32Array,
    EmployeeID?: number,
    Employee?: {
        Employee: string;
        FirstName: string;
        LastName: string;
    }
    products: ProductInterface[];

}