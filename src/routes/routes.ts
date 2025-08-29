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

export { router };