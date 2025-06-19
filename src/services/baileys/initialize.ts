import makeWASocket, { DisconnectReason, useMultiFileAuthState } from "@whiskeysockets/baileys";
import { Boom } from '@hapi/boom'
import P from "pino";

export const initializeSockState = async (): Promise<Object> => {
    const { state, saveCreds } = await useMultiFileAuthState('./auth');
    const sock = makeWASocket({
        auth: state,
        logger: P(),
        markOnlineOnConnect: true
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
                    initializeSockState().then(resolve).catch(reject);
                }
            }

            if (connection === 'open' && !resolved) {
                resolved = true;
                console.log('✅ Conexão estabelecida!');
                resolve({ isConnected: true, sock });
            }
        });
    });
}