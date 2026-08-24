 const express = require("express");

const router = express.Router();

const stockTakingController = require("./stock-taking.controller");

// Create a stock-taking session
router.post(
  "/",
  stockTakingController.createSession
);

// Get all stock-taking sessions
router.get(
  "/",
  stockTakingController.getSessions
);

// Get one stock-taking session
router.get(
  "/:id",
  stockTakingController.getSessionById
);

// Submit a stock-taking session
router.post(
  "/:id/submit",
  stockTakingController.submitSession
);

// Reconcile a stock-taking session
router.post(
  "/:id/reconcile",
  stockTakingController.reconcileSession
);

module.exports = router;