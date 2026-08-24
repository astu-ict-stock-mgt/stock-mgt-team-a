const stockTakingService = require("./stock-taking.service");

async function createSession(req, res) {
  try {
    const result = await stockTakingService.createSession(
      req.body,
      req.user
    );

    return res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
}

async function getSessions(req, res) {
  try {
    const result = await stockTakingService.getSessions();

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
}

async function getSessionById(req, res) {
  try {
    const result = await stockTakingService.getSessionById(
      req.params.id
    );

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
}

async function submitSession(req, res) {
  try {
    const result = await stockTakingService.submitSession(
      req.params.id,
      req.user
    );

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
}

async function reconcileSession(req, res) {
  try {
    const result = await stockTakingService.reconcileSession(
      req.params.id,
      req.user
    );

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = {
  createSession,
  getSessions,
  getSessionById,
  submitSession,
  reconcileSession
};