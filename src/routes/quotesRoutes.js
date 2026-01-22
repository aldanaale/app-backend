const express = require('express');
const router = express.Router();
const quotesController = require('../controllers/quotesController');
const authMiddleware = require('../middlewares/authMiddleware');
const { validateLoad } = require('../middlewares/validationMiddleware');

router.use(authMiddleware);

// Quotes CRUD
router.post('/', quotesController.createQuote);
router.get('/:id', quotesController.getQuote);
router.put('/:id', quotesController.updateQuote);
router.delete('/:id', quotesController.deleteQuote);

// Loads
router.post('/:quoteId/loads', validateLoad, quotesController.addLoad);
router.delete('/:quoteId/loads/:loadId', quotesController.deleteLoad);

module.exports = router;
