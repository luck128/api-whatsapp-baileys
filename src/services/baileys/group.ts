import { WASocket } from "@whiskeysockets/baileys";

export interface GroupInfo {
    id: string;
    subject: string;
    participants: string[];
    admins: string[];
}

export const findGroupByName = async (sock: WASocket, groupName: string): Promise<string | null> => {
    try {
        console.log(`🔍 Buscando grupo com nome: "${groupName}"`);
        
        // Verifica se o socket está conectado
        if (!sock.user?.id) {
            console.log(`❌ Socket não está autenticado`);
            return null;
        }
        
        const userId = sock.user.id; // Captura o ID para usar depois
        
        // Busca todos os grupos em que o bot participa
        const groups = await sock.groupFetchAllParticipating();
        console.log(`📊 Total de grupos encontrados: ${Object.keys(groups).length}`);
        
        // Procura por um grupo com nome similar (case insensitive)
        const foundGroup = Object.values(groups).find(group => 
            group.subject.toLowerCase().includes(groupName.toLowerCase())
        );
        
        if (foundGroup) {
            console.log(`✅ Grupo encontrado: "${foundGroup.subject}" (ID: ${foundGroup.id})`);
            console.log(`👥 Participantes: ${foundGroup.participants.length}`);
            
            // Verifica se o bot ainda é participante
            const botParticipant = foundGroup.participants.find(p => p.id === userId);
            if (!botParticipant) {
                console.log(`⚠️ Bot não é mais participante do grupo: ${foundGroup.subject}`);
                return null;
            }
            
            return foundGroup.id;
        }
        
        console.log(`❌ Grupo não encontrado com nome: "${groupName}"`);
        return null;
    } catch (error: any) {
        console.error('❌ Erro ao buscar grupo por nome:', error);
        
        if (error.message?.includes('not-authorized') || error.message?.includes('forbidden')) {
            console.error('🔒 Bot não tem permissão para buscar grupos');
        } else if (error.message?.includes('connection') || error.message?.includes('socket')) {
            console.error('🔌 Erro de conexão ao buscar grupos');
        }
        
        return null;
    }
};

export const getAllGroups = async (sock: WASocket): Promise<GroupInfo[]> => {
    try {
        // Verifica se o socket está conectado
        if (!sock.user?.id) {
            console.log(`❌ Socket não está autenticado para buscar grupos`);
            return [];
        }
        
        const userId = sock.user.id; // Captura o ID para usar depois
        
        const groups = await sock.groupFetchAllParticipating();
        console.log(`📊 Buscando informações de ${Object.keys(groups).length} grupos...`);
        
        const groupInfos: GroupInfo[] = [];
        
        for (const [groupId, group] of Object.entries(groups)) {
            try {
                // Verifica se o bot ainda é participante
                const botParticipant = group.participants.find(p => p.id === userId);
                if (!botParticipant) {
                    console.log(`⚠️ Bot não é mais participante do grupo: ${group.subject}`);
                    continue;
                }
                
                groupInfos.push({
                    id: group.id,
                    subject: group.subject,
                    participants: group.participants.map(p => p.id),
                    admins: group.participants.filter(p => p.admin).map(p => p.id)
                });
            } catch (groupError: any) {
                console.error(`❌ Erro ao processar grupo ${group.subject}:`, groupError.message);
                continue;
            }
        }
        
        console.log(`✅ Processados ${groupInfos.length} grupos válidos`);
        return groupInfos;
    } catch (error: any) {
        console.error('❌ Erro ao buscar todos os grupos:', error);
        
        if (error.message?.includes('not-authorized') || error.message?.includes('forbidden')) {
            console.error('🔒 Bot não tem permissão para buscar grupos');
        } else if (error.message?.includes('connection') || error.message?.includes('socket')) {
            console.error('🔌 Erro de conexão ao buscar grupos');
        }
        
        return [];
    }
};

export const getGroupInfo = async (sock: WASocket, groupId: string): Promise<GroupInfo | null> => {
    try {
        // Verifica se o socket está conectado
        if (!sock.user?.id) {
            console.log(`❌ Socket não está autenticado para buscar informações do grupo`);
            return null;
        }
        
        const userId = sock.user.id; // Captura o ID para usar depois
        
        console.log(`🔍 Buscando informações do grupo: ${groupId}`);
        
        const group = await sock.groupMetadata(groupId);
        console.log(`✅ Grupo encontrado: ${group.subject}`);
        
        // Verifica se o bot ainda é participante
        const participants = await sock.groupMetadata(groupId);
        const botParticipant = participants.participants.find(p => p.id === userId);
        
        if (!botParticipant) {
            console.log(`❌ Bot não é mais participante do grupo: ${group.subject}`);
            return null;
        }
        
        return {
            id: group.id,
            subject: group.subject,
            participants: participants.participants.map(p => p.id),
            admins: participants.participants.filter(p => p.admin).map(p => p.id)
        };
    } catch (error: any) {
        console.error('❌ Erro ao buscar informações do grupo:', error);
        
        if (error.message?.includes('not-authorized') || error.message?.includes('forbidden')) {
            console.error('🔒 Bot não tem permissão para acessar este grupo');
        } else if (error.message?.includes('not-found')) {
            console.error('🔍 Grupo não encontrado');
        } else if (error.message?.includes('connection') || error.message?.includes('socket')) {
            console.error('🔌 Erro de conexão ao buscar informações do grupo');
        }
        
        return null;
    }
};

// Nova função para verificar se um grupo é válido antes de enviar mensagem
export const validateGroupForMessage = async (sock: WASocket, groupId: string): Promise<{ valid: boolean; error?: string; groupName?: string }> => {
    try {
        if (!sock.user?.id) {
            return { valid: false, error: 'Socket não autenticado' };
        }
        
        const userId = sock.user.id; // Captura o ID para usar depois
        console.log(`🔍 Validando grupo ${groupId} para envio de mensagem...`);
        console.log(`👤 ID do usuário autenticado: ${userId}`);
        
        const group = await sock.groupMetadata(groupId);
        console.log(`✅ Grupo encontrado: ${group.subject}`);
        console.log(`👥 Total de participantes: ${group.participants.length}`);
        
        // Log detalhado dos participantes para debug
        console.log(`🔍 Verificando participantes do grupo...`);
        group.participants.forEach((participant, index) => {
            console.log(`  ${index + 1}. ID: ${participant.id}, Admin: ${participant.admin || false}`);
        });
        
        // Verifica se o bot ainda é participante
        const botParticipant = group.participants.find(p => p.id === userId);
        console.log(`🔍 Procurando bot (${userId}) na lista de participantes...`);
        
        if (!botParticipant) {
            console.log(`⚠️ Bot não encontrado na lista de participantes do grupo: ${group.subject}`);
            console.log(`📋 IDs dos participantes: ${group.participants.map(p => p.id).join(', ')}`);
            console.log(`🔍 Bot ID: ${userId}`);
            
            // Tenta buscar informações atualizadas do grupo
            try {
                console.log(`🔄 Tentando buscar informações atualizadas do grupo...`);
                const updatedGroup = await sock.groupMetadata(groupId);
                console.log(`📊 Grupo atualizado - Participantes: ${updatedGroup.participants.length}`);
                
                const updatedBotParticipant = updatedGroup.participants.find(p => p.id === userId);
                if (updatedBotParticipant) {
                    console.log(`✅ Bot encontrado nas informações atualizadas do grupo!`);
                    return { valid: true, groupName: group.subject };
                } else {
                    console.log(`❌ Bot ainda não encontrado mesmo nas informações atualizadas`);
                    console.log(`📋 IDs dos participantes atualizados: ${updatedGroup.participants.map(p => p.id).join(', ')}`);
                    return { valid: false, error: 'Bot não é mais participante deste grupo', groupName: group.subject };
                }
            } catch (updateError: any) {
                console.log(`⚠️ Erro ao buscar informações atualizadas: ${updateError.message}`);
                return { valid: false, error: 'Erro ao verificar participantes do grupo', groupName: group.subject };
            }
        }
        
        console.log(`✅ Bot confirmado como participante do grupo: ${group.subject}`);
        return { valid: true, groupName: group.subject };
    } catch (error: any) {
        console.error(`❌ Erro ao validar grupo ${groupId}:`, error);
        
        if (error.message?.includes('not-authorized') || error.message?.includes('forbidden')) {
            return { valid: false, error: 'Bot não tem permissão para acessar este grupo' };
        }
        
        if (error.message?.includes('not-found')) {
            return { valid: false, error: 'Grupo não encontrado ou bot foi removido' };
        }
        
        return { valid: false, error: `Erro ao validar grupo: ${error.message}` };
    }
};
