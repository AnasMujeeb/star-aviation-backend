const mongoose = require('mongoose');

const toolIssueSchema = new mongoose.Schema(
  {
    toolName: {
      type: String,
      required: [true, 'Tool name is required'],
      trim: true,
      maxlength: [200, 'Tool name cannot exceed 200 characters'],
    },
    issuedTo: {
      type: String,
      required: [true, 'Technician name is required'],
      trim: true,
      maxlength: [100, 'Technician name cannot exceed 100 characters'],
    },
    issuedAt: {
      type: Date,
      required: [true, 'Issue date/time is required'],
      default: Date.now,
    },
    returnedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ['Issued', 'Returned'],
        message: '{VALUE} is not a valid status',
      },
      default: 'Issued',
    },
    conditionOnIssue: {
      type: String,
      required: [true, 'Condition on issue is required'],
      trim: true,
    },
    conditionOnReturn: {
      type: String,
      trim: true,
      default: '',
    },
    comments: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
toolIssueSchema.index({ status: 1 });
toolIssueSchema.index({ issuedAt: -1 });
toolIssueSchema.index({ issuedTo: 1 });

// Ensure virtuals are included in JSON output
toolIssueSchema.set('toJSON', { virtuals: true });
toolIssueSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ToolIssue', toolIssueSchema);
