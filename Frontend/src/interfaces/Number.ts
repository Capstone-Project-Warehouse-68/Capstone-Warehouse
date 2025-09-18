export interface NumberRoleInterface {
    ID?: number;
    Numb?: number;
    RoleID?: number;
    Role?: {
        ID?: number;
        RoleName?: string;                 // ชื่อไทย เช่น "เจ้าของร้าน"
        RoleNickName?: "OW" | "MN" | "EMP"; // คำย่อ เช่น "OW" | "MN" | "EMP"
    } | null;
}