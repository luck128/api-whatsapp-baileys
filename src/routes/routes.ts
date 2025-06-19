const express = require('express');
const router = express.Router();

const { getStatus } = require('../controllers/status');
const { postSendMessage } = require('../controllers/messageController');

router.get('/', getStatus);
router.post('/message', postSendMessage);

export { router };