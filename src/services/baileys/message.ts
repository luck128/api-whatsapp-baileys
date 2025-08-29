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
        console.log(`📤 Tentando enviar mensagem para ${name}/${session} -> ${contact}`);
        
        const { sock, isConnected, qr } = await getOrCreateSession(name, session);

        if (!isConnected || !sock) {
            console.log(`❌ Sessão não conectada para ${name}/${session}`);
            return { success: false, needsAuth: true, qr };
        }

        // Verifica se o socket ainda está válido
        if (!sock.user || !sock.user.id) {
            console.log(`❌ Socket inválido para ${name}/${session}`);
            return { success: false, error: 'Socket inválido ou não autenticado.' };
        }

        // Log para debug
        console.log(`📨 Enviando mensagem para: ${contact}`);
        console.log(`📱 Tipo de contato: ${contact.includes('@g.us') ? 'Grupo' : 'Individual'}`);
        console.log(`👤 Usuário autenticado: ${sock.user.id}`);

        await sock.sendMessage(contact, { text: message });

        console.log(`✅ Mensagem enviada com sucesso para: ${contact}`);
        return { success: true };
    } catch (error: any) {
        console.error('❌ Erro ao enviar mensagem:', error);
        console.error('📞 Contato que falhou:', contact);
        console.error('👤 Sessão:', `${name}/${session}`);
        
        // Se o erro for relacionado à conexão, marca como precisa de autenticação
        if (error.message?.includes('connection') || error.message?.includes('socket')) {
            return { success: false, needsAuth: true, error: 'Conexão perdida. É necessário autenticar novamente.' };
        }
        
        return { success: false, error: `Erro ao enviar mensagem: ${error.message || 'Erro desconhecido'}` };
    }
};
