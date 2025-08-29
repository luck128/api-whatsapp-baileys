import makeWASocket, { DisconnectReason, useMultiFileAuthState } from "@whiskeysockets/baileys";
import { Boom } from '@hapi/boom'
import { WASocket } from "@whiskeysockets/baileys";
import P from "pino";

export const initializeSockState = async (
  name: string,
  sessionId: string
): Promise<{ isConnected: boolean, sock?: WASocket, qr?: string }> => {
    const { state, saveCreds } = await useMultiFileAuthState(`./auth/${name}/${sessionId}`);
    const sock = makeWASocket({
        auth: state,
        logger: P(),
        markOnlineOnConnect: true,
        syncFullHistory: false
    });

    return new Promise((resolve, reject) => {
        let resolved = false;

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr && !resolved) {
                resolved = true;
                console.log("🔐 QR Code gerado para conexão!");
                resolve({ isConnected: false, qr });
                return;
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log('❎ Conexão encerrada:', lastDisconnect?.error, ' | Reconexão?:', shouldReconnect);

                if (!shouldReconnect && !resolved) {
                    resolved = true;
                    reject(new Error("Sessão encerrada. É necessário login novamente."));
                }

                if (shouldReconnect) {
                    initializeSockState(name, sessionId).then(resolve).catch(reject);
                }
            }

            if (connection === 'open') {
                console.log('✅ Já conectado!');
                if (!resolved) {
                    resolved = true;
                    resolve({ isConnected: true, sock });
                }
            }
        });
    });
}