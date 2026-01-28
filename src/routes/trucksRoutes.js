const express = require("express");
const router = express.Router();
const trucksController = require("../controllers/trucksController");
const authMiddleware = require("../middlewares/authMiddleware");
const { validateTruck } = require("../middlewares/validationMiddleware");
const { requireRole } = require("../middlewares/roleMiddleware");

// Assuming all truck routes are protected? The requirements didn't specify explicitly but implies "Auth: ... Login... Trucks: ...".
// Usually, admin operations are protected. I will protect them.
router.use(authMiddleware);

router.get("/", trucksController.getAllTrucks);
router.post(
  "/",
  requireRole("admin"),
  validateTruck,
  trucksController.createTruck,
);
router.put(
  "/:id",
  requireRole("admin"),
  validateTruck,
  trucksController.updateTruck,
);
router.delete("/:id", requireRole("admin"), trucksController.deleteTruck);

module.exports = router;
