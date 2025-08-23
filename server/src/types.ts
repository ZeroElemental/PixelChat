// server/src/types.ts
export interface IUser {
    username: string;
    email: string;
    password?: string; // Password is optional as we don't always send it back
}