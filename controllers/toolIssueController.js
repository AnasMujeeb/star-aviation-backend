const ToolIssue = require('../models/ToolIssue');

/**
 * POST /api/tool-issues
 * Log a new tool issue with manually provided date/time.
 */
const createToolIssue = async (req, res, next) => {
  try {
    const { toolName, issuedTo, issuedAt, conditionOnIssue, comments } = req.body;

    // Basic validation
    if (!toolName || !issuedTo || !conditionOnIssue) {
      return res.status(400).json({
        success: false,
        message: 'toolName, issuedTo, and conditionOnIssue are required',
      });
    }

    const toolIssue = await ToolIssue.create({
      toolName,
      issuedTo,
      issuedAt: issuedAt ? new Date(issuedAt) : new Date(),
      conditionOnIssue,
      comments: comments || '',
    });

    res.status(201).json({
      success: true,
      data: toolIssue,
    });
  } catch (error) {
    console.error('❌ ToolIssue create error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal Server Error',
    });
  }
};

/**
 * GET /api/tool-issues
 * Fetch all tool issue records (newest first).
 * Optional query: ?status=Issued or ?status=Returned
 */
const getToolIssues = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const filter = {};

    if (status && ['Issued', 'Returned'].includes(status)) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { toolName: { $regex: search, $options: 'i' } },
        { issuedTo: { $regex: search, $options: 'i' } },
      ];
    }

    const toolIssues = await ToolIssue.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: toolIssues.length,
      data: toolIssues,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/tool-issues/:id/return
 * Mark a tool as returned with manually provided return date/time.
 * Body: { returnedAt, conditionOnReturn, comments? }
 */
const returnToolIssue = async (req, res, next) => {
  try {
    const { conditionOnReturn, returnedAt, comments } = req.body;

    if (!conditionOnReturn) {
      return res.status(400).json({
        success: false,
        message: 'conditionOnReturn is required when returning a tool',
      });
    }

    const toolIssue = await ToolIssue.findById(req.params.id);

    if (!toolIssue) {
      return res.status(404).json({
        success: false,
        message: 'Tool issue record not found',
      });
    }

    if (toolIssue.status === 'Returned') {
      return res.status(400).json({
        success: false,
        message: 'This tool has already been returned',
      });
    }

    toolIssue.status = 'Returned';
    toolIssue.returnedAt = returnedAt ? new Date(returnedAt) : new Date();
    toolIssue.conditionOnReturn = conditionOnReturn;
    if (comments !== undefined) {
      toolIssue.comments = comments;
    }

    await toolIssue.save();

    res.json({
      success: true,
      data: toolIssue,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createToolIssue,
  getToolIssues,
  returnToolIssue,
};
