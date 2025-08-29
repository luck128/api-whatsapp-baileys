import { initializeSockState } from "../services/baileys/initialize";
import { WASocket } from "@whiskeysockets/baileys";
const sessions = new Map<string, WASocket>();

// Função para limpar sessões inativas
export const cleanupInactiveSessions = async () => {
    const keysToRemove: string[] = [];
    
    for (const [key, sock] of sessions.entries()) {
        if (!sock || !sock.user || !sock.user.id) {
            keysToRemove.push(key);
            continue;
        }
        
        try {
            // Tenta fazer uma operação simples para verificar se a conexão está ativa
            await sock.presenceSubscribe(sock.user.id);
        } catch (error) {
            console.log(`🧹 Limpando sessão inativa: ${key}`);
            keysToRemove.push(key);
        }
    }
    
    // Remove as sessões inativas
    keysToRemove.forEach(key => sessions.delete(key));
    
    if (keysToRemove.length > 0) {
        console.log(`🧹 ${keysToRemove.length} sessões inativas foram removidas`);
    }
};

export const getOrCreateSession = async (
    name: string,
    sessionId: string
): Promise<{ sock?: WASocket; qr?: string; isConnected: boolean }> => {
    const key = `${name}-${sessionId}`;

    if (sessions.has(key)) {
        const sock = sessions.get(key);
        
        // Verifica se a conexão ainda está realmente ativa
        if (sock && sock.user && sock.user.id) {
            try {
                // Tenta fazer uma operação simples para verificar se a conexão está ativa
                await sock.presenceSubscribe(sock.user.id);
                console.log(`✅ Usando sessão existente: ${key}`);
                return { sock, isConnected: true };
            } catch (error) {
                console.log(`❌ Sessão ${key} não está mais ativa, removendo...`);
                sessions.delete(key);
                // Continua para criar uma nova sessão
            }
        } else {
            // Se não tem user.id, a sessão não está válida
            console.log(`❌ Sessão ${key} inválida, removendo...`);
            sessions.delete(key);
        }
    }

    console.log(`🔄 Criando nova sessão para: ${key}`);
    const result = await initializeSockState(name, sessionId);

    if (result.isConnected && result.sock) {
        sessions.set(key, result.sock);
        console.log(`✅ Nova sessão criada e armazenada: ${key}`);
        return { sock: result.sock, isConnected: true };
    }

    return {
        isConnected: false,
        qr: result.qr
    };
};

// Função para obter estatísticas das sessões
export const getSessionStats = () => {
    return {
        total: sessions.size,
        active: Array.from(sessions.values()).filter(sock => sock && sock.user && sock.user.id).length
    };
};