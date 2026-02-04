const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const uploadsController = require('../controllers/uploadsController');

router.use(authMiddleware);

router.post('/', uploadsController.create);
router.get('/', uploadsController.list);
router.get('/:id/download', uploadsController.download);

module.exports = router;
