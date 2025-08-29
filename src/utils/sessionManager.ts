import { initializeSockState } from "../services/baileys/initialize";
import { WASocket } from "@whiskeysockets/baileys";
const sessions = new Map<string, WASocket>();

export const getOrCreateSession = async (
    name: string,
    sessionId: string
): Promise<{ sock?: WASocket; qr?: string; isConnected: boolean }> => {
    const key = `${name}-${sessionId}`;

    if (sessions.has(key)) {
        const sock = sessions.get(key);
        return { sock, isConnected: true };
    }

    const result = await initializeSockState(name, sessionId);

    if (result.isConnected && result.sock) {
        sessions.set(key, result.sock);
        return { sock: result.sock, isConnected: true };
    }

    return {
        isConnected: false,
        qr: result.qr
    };
};