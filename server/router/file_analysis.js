const express = require('express');
const router = express.Router();
const { analyzeBatch, generatePageRelationships } = require('../controller/file_analysis_controller');

// POST /api/file-analysis/batch
router.post('/batch', analyzeBatch);

// POST /api/file-analysis/relationships
router.post('/relationships', generatePageRelationships);

module.exports = router;