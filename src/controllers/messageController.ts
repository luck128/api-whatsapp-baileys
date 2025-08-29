import { Request, Response } from "express";
import { sendMessage } from "../services/baileys/message";

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
        const result = await sendMessage(name, sessionId, `${contact}@s.whatsapp.net`, message);

        if (result.needsAuth) {
            return res.status(200).json({
                code: 200,
                success: true,
                message: 'Antes de realizar essa ação você precisa se autenticar.',
                qr: result.qr
            });
        }

        if (!result.success) {
            return res.status(502).json({
                code: 502,
                success: false,
                message: result.error || 'Erro ao realizar a integração para envio.'
            });
        }

        return res.status(200).json({
            code: 200,
            success: true,
            message: 'Mensagem enviada com sucesso',
            data: {
                to: contact,
                message,
                type: 'embed_message',
                sended_at: new Date().toISOString()
            }
        });

    } catch (error) {
        return res.status(500).json({
            code: 500,
            success: false,
            message: 'Erro interno do servidor.'
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

                await Promise.all(
                    block.map((contact: string, message: string) => sendMessage(name, sessionId, `${contact}@s.whatsapp.net`, message)) 
                );

                console.log("Mensagens enviadas com sucesso.");
            } catch (err) {
                console.error("Erro ao enviar mensagens:", err);
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

module.exports = {
    postSendMessage,
    postSendMessagePerBlocks
}