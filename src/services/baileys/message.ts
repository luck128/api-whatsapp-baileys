import { getOrCreateSession } from "../../utils/sessionManager";

type SendMessageResult = {
    success: boolean;
    needsAuth?: boolean;
    error?: string;
    qr?: string;
};

export const sendMessage = async (
    name: string,
    session: string,
    contact: string,
    message: string
): Promise<SendMessageResult> => {
    try {
        const { sock, isConnected, qr } = await getOrCreateSession(name, session);

        if (!isConnected || !sock) {
            return { success: false, needsAuth: true, qr };
        }

        await sock.sendMessage(`${contact}@s.whatsapp.net`, { text: message });

        return { success: true };
    } catch (error: any) {
        console.error('Erro ao enviar mensagem:', error);
        return { success: false, error: 'Erro ao enviar mensagem.' };
    }
};
