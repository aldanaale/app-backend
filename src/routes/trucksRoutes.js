const express = require('express');
const router = express.Router();
const trucksController = require('../controllers/trucksController');
const authMiddleware = require('../middlewares/authMiddleware');
const { validateTruck } = require('../middlewares/validationMiddleware');

// Assuming all truck routes are protected? The requirements didn't specify explicitly but implies "Auth: ... Login... Trucks: ...".
// Usually, admin operations are protected. I will protect them.
router.use(authMiddleware);

router.get('/', trucksController.getAllTrucks);
router.post('/', validateTruck, trucksController.createTruck);
router.put('/:id', validateTruck, trucksController.updateTruck);
router.delete('/:id', trucksController.deleteTruck);

module.exports = router;
