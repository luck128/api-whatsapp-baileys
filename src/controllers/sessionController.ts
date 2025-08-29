import { Request, Response } from "express";
import { createSession, getSession } from "../services/baileys/session";

const postCreateSession = async (req: Request, res: Response) => {
    const { name } = req.body;

    if(!name) return res.status(400).json({ code: 400, success: false, message: 'Parâmetros inválidos' });

    try {
        const sessionResponse = await createSession(name);
        console.log(sessionResponse);

        if(!sessionResponse?.success) return res.status(502).json({ code: 502, success: false, message: 'Algo deu errado ao realizar a criação da sessão', error: sessionResponse?.error });

        return res.status(201).json({ code: 201, success: true, message: 'Sessão criada com sucesso!', sessionId: sessionResponse?.id });
    } catch (error) {
        return res.status(500).json({
            code: 500,
            success: false,
            message: 'Erro interno do servidor.'
        });
    }
}

const getSessionStatus = async (req: Request, res: Response) => {
    const { name, sessionId } = req.params;

    if(!sessionId) return res.status(400).json({ code: 400, success: false, message: 'Parâmetros inválidos' });

    try {
        const sessionStatus = await getSession(name, sessionId);

        if(!sessionStatus) return res.status(204).json({});

        const ts = new Date();
        ts.setHours(ts.getHours() + 720);

        return res.status(200).json({ code: 200, success: true, isActive: true, message: `Sessão ${sessionId} encontrada e ativa até ${ts.toLocaleDateString('pt-BR')}` });
    } catch (error) {
        return res.status(500).json({
            code: 500,
            success: false,
            message: 'Erro interno do servidor.'
        });
    }
}

module.exports = {
    postCreateSession,
    getSessionStatus
}