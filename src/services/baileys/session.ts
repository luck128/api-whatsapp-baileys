import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ISessionUserRes } from './types';

export const createSession = async (name: string): Promise<ISessionUserRes> => {
    if(!name) return { success: false, name, error: "Forneça um nome para criação da sessão." };

    try {
        const uuid = uuidv4();
        fs.mkdir(`./auth/${name}/${uuid}`, { recursive: true }, (err) => {
            if(err) throw err;
        });

        return {
            success: true,
            id: uuid,
            name
        }
    } catch (error) {
        console.error('Algo deu errado ao realizar a criação da sessão:', error);
        return { success: false, name, error: "Algo deu errado ao realizar a criação da sessão." }
    }
}

export const getSession = async (name: string, sessionId: string): Promise<boolean> => {
    const sessionPath = path.join('./', 'auth', name, sessionId);
    if(!fs.existsSync(sessionPath))  {
        return false;
    }

    return true;
}