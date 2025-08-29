import { WASocket } from "@whiskeysockets/baileys";

export type ISock = {
    isConnected: boolean;
    sock: WASocket;
    qr: string;
}

export interface ISessionUserRes {
    success: boolean;
    id?: string;
    name?: string;
    error?: string;
}