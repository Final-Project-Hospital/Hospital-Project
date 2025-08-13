import { ReactNode } from "react";

export interface UsersInterface {
    ID?: number;
    Username?: string;
    Password?: string;
    Email?: string;
    FirstName?: string;
    LastName?: string;
    Profile?: string;
    Role?: {
        ID: number;
        RoleName: string;
    };
    Position?: {
        ID: number;
        Position: string;
    };
    Phonenumber?: string;  // หรือ PhoneNumber?  ให้เป็น optional
    PhoneNumber?: ReactNode;  
    Phone?:string;
}