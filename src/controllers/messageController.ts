import { Request, Response } from "express";
import { sendMessage } from "../services/baileys/message";

const postSendMessage = async (req: Request, res: Response) => {
    const { contact, message } = req.body;

    if (!contact || !message) {
        return res.status(400).json({
            code: 400,
            success: false,
            message: 'Parâmetros inválidos.'
        });
    }

    try {
        const result = await sendMessage(`${contact}@s.whatsapp.net`, message);

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

module.exports = {
    postSendMessage
}