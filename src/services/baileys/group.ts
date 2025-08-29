import { WASocket } from "@whiskeysockets/baileys";

export interface GroupInfo {
    id: string;
    subject: string;
    participants: string[];
    admins: string[];
}

// Função auxiliar para verificar se o bot é participante usando múltiplas abordagens
const isBotParticipant = async (sock: WASocket, groupId: string, userId: string): Promise<{ isParticipant: boolean; method: string; details?: any }> => {
    console.log(`🔍 Verificando participação do bot usando múltiplas abordagens...`);
    
    // Método 1: groupFetchAllParticipating
    try {
        console.log(`📋 Método 1: groupFetchAllParticipating`);
        const allGroups = await sock.groupFetchAllParticipating();
        const group = allGroups[groupId];
        
        if (group) {
            const participant = group.participants.find(p => p.id === userId);
            if (participant) {
                console.log(`✅ Método 1: Bot encontrado como participante`);
                return { isParticipant: true, method: 'groupFetchAllParticipating', details: participant };
            }
        }
        console.log(`❌ Método 1: Bot não encontrado`);
    } catch (error: any) {
        console.log(`⚠️ Método 1 falhou: ${error.message}`);
    }
    
    // Método 2: groupMetadata
    try {
        console.log(`📋 Método 2: groupMetadata`);
        const groupMetadata = await sock.groupMetadata(groupId);
        const participant = groupMetadata.participants.find(p => p.id === userId);
        
        if (participant) {
            console.log(`✅ Método 2: Bot encontrado como participante`);
            return { isParticipant: true, method: 'groupMetadata', details: participant };
        }
        console.log(`❌ Método 2: Bot não encontrado`);
    } catch (error: any) {
        console.log(`⚠️ Método 2 falhou: ${error.message}`);
    }
    
    // Método 3: Tentar enviar uma mensagem de teste (muito silenciosa)
    try {
        console.log(`📋 Método 3: Teste de envio silencioso`);
        // Tenta enviar uma mensagem muito pequena para testar permissões
        const testResult = await sock.sendMessage(groupId, { 
            text: "."
        });
        
        if (testResult) {
            console.log(`✅ Método 3: Bot conseguiu enviar mensagem (é participante)`);
            return { isParticipant: true, method: 'testMessage', details: testResult };
        }
    } catch (error: any) {
        console.log(`⚠️ Método 3 falhou: ${error.message}`);
    }
    
    // Método 4: Verificar se o grupo está na lista de grupos do usuário
    try {
        console.log(`📋 Método 4: Verificação de propriedades do socket`);
        if (sock.user?.id) {
            // Verifica se o grupo está listado nas propriedades do socket
            const userGroups = (sock as any).groups;
            if (userGroups && userGroups[groupId]) {
                console.log(`✅ Método 4: Grupo encontrado nas propriedades do socket`);
                return { isParticipant: true, method: 'socketProperties', details: userGroups[groupId] };
            }
        }
        console.log(`❌ Método 4: Grupo não encontrado nas propriedades do socket`);
    } catch (error: any) {
        console.log(`⚠️ Método 4 falhou: ${error.message}`);
    }
    
    console.log(`❌ Todos os métodos falharam - Bot não é participante`);
    return { isParticipant: false, method: 'allMethodsFailed' };
};

export const findGroupByName = async (sock: WASocket, groupName: string): Promise<string | null> => {
    try {
        console.log(`🔍 Buscando grupo com nome: "${groupName}"`);
        
        // Verifica se o socket está conectado
        if (!sock.user?.id) {
            console.log(`❌ Socket não está autenticado`);
            return null;
        }
        
        const userId = sock.user.id; // Captura o ID para usar depois
        console.log(`👤 ID do usuário autenticado: ${userId}`);
        
        // Busca todos os grupos em que o bot participa
        const groups = await sock.groupFetchAllParticipating();
        console.log(`📊 Total de grupos encontrados: ${Object.keys(groups).length}`);
        
        // Procura por um grupo com nome similar (case insensitive)
        const foundGroup = Object.values(groups).find(group => 
            group.subject.toLowerCase().includes(groupName.toLowerCase())
        );
        
        if (foundGroup) {
            console.log(`✅ Grupo encontrado: "${foundGroup.subject}" (ID: ${foundGroup.id})`);
            console.log(`👥 Total de participantes: ${foundGroup.participants.length}`);
            
            // Log detalhado dos participantes para debug
            console.log(`🔍 Verificando participantes do grupo...`);
            foundGroup.participants.forEach((participant, index) => {
                console.log(`  ${index + 1}. ID: ${participant.id}, Admin: ${participant.admin || false}`);
            });
            
            // Verifica se o bot ainda é participante usando múltiplas abordagens
            const participationCheck = await isBotParticipant(sock, foundGroup.id, userId);
            
            if (participationCheck.isParticipant) {
                console.log(`✅ Bot confirmado como participante do grupo usando: ${participationCheck.method}`);
                return foundGroup.id;
            } else {
                console.log(`⚠️ Bot não confirmado como participante, mas grupo foi encontrado`);
                console.log(`📋 Método usado: ${participationCheck.method}`);
                
                // Mesmo que a verificação falhe, retorna o ID do grupo
                // O sistema tentará enviar a mensagem mesmo assim
                console.log(`🔄 Retornando ID do grupo para tentativa de envio...`);
                return foundGroup.id;
            }
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
        
        // Verifica se o bot ainda é participante usando múltiplas abordagens
        const participationCheck = await isBotParticipant(sock, groupId, userId);
        
        if (participationCheck.isParticipant) {
            console.log(`✅ Bot confirmado como participante do grupo usando: ${participationCheck.method}`);
            return { valid: true, groupName: group.subject };
        } else {
            console.log(`⚠️ Bot não confirmado como participante, mas continuando...`);
            console.log(`📋 Método usado: ${participationCheck.method}`);
            
            // Mesmo que a verificação falhe, considera válido para tentar envio
            // O sistema tentará enviar a mensagem mesmo assim
            return { valid: true, groupName: group.subject };
        }
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
