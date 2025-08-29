import { Request, Response } from "express";
import { sendMessage } from "../services/baileys/message";
import { findGroupByName, validateGroupForMessage } from "../services/baileys/group";
import { getOrCreateSession } from "../utils/sessionManager";

// Função auxiliar para formatar o contato corretamente
const formatContact = async (contact: string, sock: any): Promise<string> => {
    // Se o contato já contém @s.whatsapp.net ou @g.us, retorna como está
    if (contact.includes('@s.whatsapp.net') || contact.includes('@g.us')) {
        return contact;
    }
    
    // Se o contato contém apenas números, é um número individual
    if (/^\d+$/.test(contact)) {
        return `${contact}@s.whatsapp.net`;
    }
    
    // Se contém letras ou caracteres especiais, tenta buscar como grupo
    console.log(`🔍 Tentando buscar grupo com nome: "${contact}"`);
    const groupId = await findGroupByName(sock, contact);
    
    if (groupId) {
        return `${groupId}@g.us`;
    }
    
    // Se não encontrou o grupo, retorna o contato original para gerar erro
    return contact;
};

const postSendMessage = async (req: Request, res: Response) => {
    const { name, sessionId, contact, message } = req.body;

    if (!name || !sessionId || !contact || !message) {
        return res.status(400).json({
            code: 400,
            success: false,
            message: 'Parâmetros inválidos.'
        });
    }

    try {
        console.log(`📤 Iniciando envio de mensagem para: ${contact}`);
        console.log(`👤 Sessão: ${name}/${sessionId}`);
        
        // Primeiro, obtém a sessão para ter acesso ao socket
        const { sock, isConnected, qr } = await getOrCreateSession(name, sessionId);

        if (!isConnected || !sock) {
            console.log(`❌ Sessão não conectada para ${name}/${sessionId}`);
            return res.status(200).json({
                code: 200,
                success: true,
                message: 'Antes de realizar essa ação você precisa se autenticar.',
                qr: qr
            });
        }

        // Formata o contato (pode ser número ou nome de grupo)
        const formattedContact = await formatContact(contact, sock);
        console.log(`📱 Contato formatado: ${formattedContact}`);
        
        // Validação: se não conseguiu formatar o contato, é porque não encontrou o grupo
        if (!formattedContact.includes('@s.whatsapp.net') && !formattedContact.includes('@g.us')) {
            return res.status(400).json({
                code: 400,
                success: false,
                message: `Grupo "${contact}" não encontrado. Verifique se o nome está correto e se o bot está no grupo.`
            });
        }
        
        // Validação específica para grupos
        if (formattedContact.includes('@g.us')) {
            console.log(`👥 Validando grupo antes do envio: ${formattedContact}`);
            const groupValidation = await validateGroupForMessage(sock, formattedContact.replace('@g.us', ''));
            
            if (!groupValidation.valid) {
                console.log(`❌ Validação do grupo falhou: ${groupValidation.error}`);
                return res.status(400).json({
                    code: 400,
                    success: false,
                    message: `Erro ao validar grupo: ${groupValidation.error}`,
                    groupName: groupValidation.groupName
                });
            }
            
            console.log(`✅ Grupo validado com sucesso: ${groupValidation.groupName}`);
        }
        
        // Envia a mensagem
        console.log(`🚀 Enviando mensagem...`);
        const result = await sendMessage(name, sessionId, formattedContact, message);

        if (result.needsAuth) {
            console.log(`🔐 Sessão precisa de autenticação`);
            return res.status(200).json({
                code: 200,
                success: true,
                message: 'Antes de realizar essa ação você precisa se autenticar.',
                qr: result.qr
            });
        }

        if (!result.success) {
            console.log(`❌ Falha no envio: ${result.error}`);
            return res.status(502).json({
                code: 502,
                success: false,
                message: result.error || 'Erro ao realizar a integração para envio.'
            });
        }

        // Determina o tipo de contato para a resposta
        const contactType = formattedContact.includes('@g.us') ? 'group' : 'individual';
        
        console.log(`✅ Mensagem enviada com sucesso para ${contactType}: ${contact}`);
        
        return res.status(200).json({
            code: 200,
            success: true,
            message: 'Mensagem enviada com sucesso',
            data: {
                to: contact,
                formattedTo: formattedContact,
                message,
                type: 'embed_message',
                contactType,
                sended_at: new Date().toISOString()
            }
        });

    } catch (error: any) {
        console.error('❌ Erro no controller:', error);
        console.error('📋 Detalhes do erro:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        
        return res.status(500).json({
            code: 500,
            success: false,
            message: 'Erro interno do servidor.',
            error: error.message
        });
    }
}

const postSendMessagePerBlocks = async (req: Request, res: Response) => {
    const { name, sessionId, block } = req.body;

    if (!name || !sessionId || !block) return res.status(400).json({ code: 400, success: false, message: 'Parâmetros inválidos' });

    try {
        res.status(200).json({
            code: 200,
            success: true,
            message: 'INFO: Os blocos de mensagens estão sendo preparados para o envio.'
        });

        (async () => {
            try {
                await new Promise(resolve => setTimeout(resolve, 10000));

                // Obtém a sessão uma vez para todos os envios
                const { sock, isConnected } = await getOrCreateSession(name, sessionId);
                
                if (!isConnected || !sock) {
                    console.error("Sessão não está conectada para envio em blocos");
                    return;
                }

                await Promise.all(
                    block.map(async (item: { contact: string, message: string }) => {
                        try {
                            const formattedContact = await formatContact(item.contact, sock);
                            
                            // Valida se conseguiu formatar o contato
                            if (!formattedContact.includes('@s.whatsapp.net') && !formattedContact.includes('@g.us')) {
                                console.error(`❌ Contato inválido no bloco: ${item.contact}`);
                                return;
                            }
                            
                            return sendMessage(name, sessionId, formattedContact, item.message);
                        } catch (err) {
                            console.error(`❌ Erro ao processar contato ${item.contact}:`, err);
                        }
                    })
                );

                console.log("✅ Mensagens enviadas com sucesso.");
            } catch (err) {
                console.error("❌ Erro ao enviar mensagens:", err);
            }
        })();
    } catch (error) {
        return res.status(500).json({
            code: 500,
            success: false,
            message: 'Erro interno do servidor.'
        });
    }
}

const getGroups = async (req: Request, res: Response) => {
    const { name, sessionId } = req.body;

    if (!name || !sessionId) {
        return res.status(400).json({
            code: 400,
            success: false,
            message: 'Parâmetros inválidos. Nome e sessionId são obrigatórios.'
        });
    }

    try {
        const { sock, isConnected, qr } = await getOrCreateSession(name, sessionId);

        if (!isConnected || !sock) {
            return res.status(200).json({
                code: 200,
                success: true,
                message: 'Antes de realizar essa ação você precisa se autenticar.',
                qr: qr
            });
        }

        // Importa a função getAllGroups
        const { getAllGroups } = require("../services/baileys/group");
        const groups = await getAllGroups(sock);

        return res.status(200).json({
            code: 200,
            success: true,
            message: 'Grupos encontrados com sucesso',
            data: {
                total: groups.length,
                groups: groups.map((group: any) => ({
                    id: group.id,
                    name: group.subject,
                    participants: group.participants.length,
                    admins: group.admins.length
                }))
            }
        });

    } catch (error) {
        console.error('Erro ao buscar grupos:', error);
        return res.status(500).json({
            code: 500,
            success: false,
            message: 'Erro interno do servidor.'
        });
    }
}

module.exports = {
    postSendMessage,
    postSendMessagePerBlocks,
    getGroups
}