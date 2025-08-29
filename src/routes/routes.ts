const express = require('express');
const router = express.Router();

const { getStatus } = require('../controllers/status');
const { postSendMessage, postSendMessagePerBlocks } = require('../controllers/messageController');
const { postCreateSession, getSessionStatus } = require('../controllers/sessionController');

router.get('/', getStatus);
router.post('/message', postSendMessage);
router.post('/message/blocks', postSendMessagePerBlocks);

router.post('/session', postCreateSession);
router.get('/session/:name/:sessionId', getSessionStatus);

export { router };