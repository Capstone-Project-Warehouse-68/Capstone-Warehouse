export interface SupplyInterface {
    ID: number,
    SupplyName?: string,
    Address?: string,
    PhoneNumberSale?: string,
    SaleName?: string,
    BankTypeID?: number,
    BankType: {
        ID: number,
        BankTypeName?: string,
    },
    BankAccountNumber?: string,
    LineIDSale?: string,
}

export interface SupplySelect {
  ID: number;  
    SupplyName: string;
}