const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const uploadsController = require('../controllers/uploadsController');

router.post('/', authMiddleware, ...uploadsController.create);
router.get('/', authMiddleware, uploadsController.list);
router.get('/:id/download', authMiddleware, uploadsController.download);
router.get('/:id/insights', authMiddleware, uploadsController.insights);
router.post('/:id/reanalyze', authMiddleware, uploadsController.reanalyze);

module.exports = router;
