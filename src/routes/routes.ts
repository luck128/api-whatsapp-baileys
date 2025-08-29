const express = require('express');
const router = express.Router();

const { getStatus } = require('../controllers/status');
const { postSendMessage, postSendMessagePerBlocks, getGroups } = require('../controllers/messageController');
const { postCreateSession, getSessionStatus } = require('../controllers/sessionController');

router.get('/', getStatus);
router.post('/message', postSendMessage);
router.post('/message/blocks', postSendMessagePerBlocks);
router.post('/groups', getGroups);

router.post('/session', postCreateSession);
router.get('/session/:name/:sessionId', getSessionStatus);

// Novas rotas para gerenciamento de sessões
router.post('/session/cleanup', async (req: any, res: any) => {
    try {
        const { cleanupInactiveSessions } = require('../utils/sessionManager');
        await cleanupInactiveSessions();
        res.json({ success: true, message: 'Sessões inativas foram limpas' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/session/stats', async (req: any, res: any) => {
    try {
        const { getSessionStats } = require('../utils/sessionManager');
        const stats = getSessionStats();
        res.json({ success: true, data: stats });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export { router };