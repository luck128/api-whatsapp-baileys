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

        // Log para debug
        console.log(`Enviando mensagem para: ${contact}`);
        console.log(`Tipo de contato: ${contact.includes('@g.us') ? 'Grupo' : 'Individual'}`);

        await sock.sendMessage(contact, { text: message });

        console.log(`Mensagem enviada com sucesso para: ${contact}`);
        return { success: true };
    } catch (error: any) {
        console.error('Erro ao enviar mensagem:', error);
        console.error('Contato que falhou:', contact);
        return { success: false, error: 'Erro ao enviar mensagem.' };
    }
};
