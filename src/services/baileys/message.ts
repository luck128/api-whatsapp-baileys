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
        if (!sock.user?.id) {
            console.log(`❌ Socket inválido para ${name}/${session}`);
            return { success: false, error: 'Socket inválido ou não autenticado.' };
        }

        const userId = sock.user.id; // Captura o ID para usar depois

        // Log para debug
        console.log(`📨 Enviando mensagem para: ${contact}`);
        console.log(`📱 Tipo de contato: ${contact.includes('@g.us') ? 'Grupo' : 'Individual'}`);
        console.log(`👤 Usuário autenticado: ${userId}`);

        // Validações específicas para grupos
        if (contact.includes('@g.us')) {
            try {
                // Verifica se o grupo ainda existe e se o bot ainda está nele
                const groupMetadata = await sock.groupMetadata(contact);
                console.log(`👥 Grupo válido: ${groupMetadata.subject}`);
                
                // Verifica se o bot ainda é participante do grupo
                const participants = await sock.groupMetadata(contact);
                const botParticipant = participants.participants.find(p => p.id === userId);
                
                if (!botParticipant) {
                    console.log(`❌ Bot não é mais participante do grupo: ${contact}`);
                    return { success: false, error: 'Bot não é mais participante deste grupo.' };
                }
                
                console.log(`✅ Bot é participante do grupo: ${contact}`);
            } catch (groupError: any) {
                console.error(`❌ Erro ao validar grupo ${contact}:`, groupError);
                
                if (groupError.message?.includes('not-authorized') || groupError.message?.includes('forbidden')) {
                    return { success: false, error: 'Bot não tem permissão para acessar este grupo.' };
                }
                
                if (groupError.message?.includes('not-found')) {
                    return { success: false, error: 'Grupo não encontrado ou bot foi removido.' };
                }
                
                return { success: false, error: `Erro ao validar grupo: ${groupError.message}` };
            }
        }

        // Tenta enviar a mensagem
        console.log(`🚀 Iniciando envio da mensagem...`);
        const result = await sock.sendMessage(contact, { text: message });
        
        if (result) {
            console.log(`✅ Mensagem enviada com sucesso para: ${contact}`);
            console.log(`📝 ID da mensagem: ${result.key?.id || 'N/A'}`);
            return { success: true };
        } else {
            console.log(`⚠️ Envio concluído mas sem confirmação para: ${contact}`);
            return { success: true }; // Considera sucesso mesmo sem confirmação
        }

    } catch (error: any) {
        console.error('❌ Erro ao enviar mensagem:', error);
        console.error('📞 Contato que falhou:', contact);
        console.error('👤 Sessão:', `${name}/${session}`);
        console.error('🔍 Tipo de erro:', error.constructor.name);
        console.error('📋 Mensagem de erro:', error.message);
        
        // Tratamento específico para diferentes tipos de erro
        if (error.message?.includes('connection') || error.message?.includes('socket')) {
            return { success: false, needsAuth: true, error: 'Conexão perdida. É necessário autenticar novamente.' };
        }
        
        if (error.message?.includes('not-authorized') || error.message?.includes('forbidden')) {
            return { success: false, error: 'Não autorizado para enviar mensagem para este contato/grupo.' };
        }
        
        if (error.message?.includes('not-found')) {
            return { success: false, error: 'Contato ou grupo não encontrado.' };
        }
        
        if (error.message?.includes('Stream Errored Out')) {
            return { success: false, error: 'Erro de conexão com WhatsApp. Tente novamente em alguns instantes.' };
        }
        
        return { success: false, error: `Erro ao enviar mensagem: ${error.message || 'Erro desconhecido'}` };
    }
};
