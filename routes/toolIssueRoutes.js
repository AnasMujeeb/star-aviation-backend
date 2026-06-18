const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createToolIssue,
  getToolIssues,
  returnToolIssue,
} = require('../controllers/toolIssueController');

// All routes require authentication
router.post('/', createToolIssue);
router.get('/', getToolIssues);
router.put('/:id/return', returnToolIssue);

module.exports = router;
