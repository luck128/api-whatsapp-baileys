import { WASocket } from "@whiskeysockets/baileys";

export type ISock = {
    isConnected: boolean;
    sock: WASocket;
    qr: string;
}