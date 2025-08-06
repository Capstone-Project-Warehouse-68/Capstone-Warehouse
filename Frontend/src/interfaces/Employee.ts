export interface EmployeeInterface {
    ID?: number;
    FirstName?: string;
    LastName?: string;
    PhoneNumber?: string;
    NationalId? : string;
    Email?: string;
    Password?: string;
    Profile?: string;
    RoleID?: number;
    BankAccountNumber?: number;
    Line?: string;

    Role? : {
        ID?: number;
        RoleName?: string;
    }

    BankType? : {
        ID?: number;
        BankTypeName?: string;
    }
}