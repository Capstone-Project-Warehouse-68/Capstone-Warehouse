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

}