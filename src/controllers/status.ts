import { Request, Response } from "express"

export const getStatus = (req: Request, res: Response) => {
    return res.status(200).json({
        code: 200,
        success: true,
        message: 'Server is running fine! 🚀',
        ts: Date.now()
    });
}