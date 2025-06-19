import { initializeSockState } from "./initialize";
import { ISock } from "./types";

type SendMessageResult = {
    success: boolean;
    needsAuth?: boolean;
    error?: string;
    qr?: string;
}

export const sendMessage = async (contact: string, message: string): Promise<SendMessageResult> => {
    try {
        const { sock, isConnected, qr } = await initializeSockState() as ISock;

        if (!isConnected) {
            return { success: false, needsAuth: true, qr };
        }

        await sock.sendMessage(contact, { text: message });
        return { success: true };

    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        return { success: false, error: 'Erro ao enviar mensagem.' };
    }
}
