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
        
        // Busca todos os grupos em que o bot participa
        const groups = await sock.groupFetchAllParticipating();
        
        // Procura por um grupo com nome similar (case insensitive)
        const foundGroup = Object.values(groups).find(group => 
            group.subject.toLowerCase().includes(groupName.toLowerCase())
        );
        
        if (foundGroup) {
            console.log(`✅ Grupo encontrado: "${foundGroup.subject}" (ID: ${foundGroup.id})`);
            return foundGroup.id;
        }
        
        console.log(`❌ Grupo não encontrado com nome: "${groupName}"`);
        return null;
    } catch (error) {
        console.error('Erro ao buscar grupo por nome:', error);
        return null;
    }
};

export const getAllGroups = async (sock: WASocket): Promise<GroupInfo[]> => {
    try {
        const groups = await sock.groupFetchAllParticipating();
        
        return Object.values(groups).map(group => ({
            id: group.id,
            subject: group.subject,
            participants: group.participants.map(p => p.id),
            admins: group.participants.filter(p => p.admin).map(p => p.id)
        }));
    } catch (error) {
        console.error('Erro ao buscar todos os grupos:', error);
        return [];
    }
};

export const getGroupInfo = async (sock: WASocket, groupId: string): Promise<GroupInfo | null> => {
    try {
        const group = await sock.groupMetadata(groupId);
        const participants = await sock.groupMetadata(groupId);
        
        return {
            id: group.id,
            subject: group.subject,
            participants: participants.participants.map(p => p.id),
            admins: participants.participants.filter(p => p.admin).map(p => p.id)
        };
    } catch (error) {
        console.error('Erro ao buscar informações do grupo:', error);
        return null;
    }
};
