const express = require('express');
const router = express.Router();
const controller = require('../controllers/hardwareController');
const authMiddleware = require('../middleware/authMiddleware');  // Update this line

// =====================
// Hardware inventory
// =====================
router.get('/', controller.listHardware);
router.post('/', controller.createHardware);
router.put('/:id', controller.updateHardware);
router.delete('/:id', controller.deleteHardware);

// =====================
// Hardware issues
// =====================
router.post('/issues', controller.issueHardware);
router.post('/issues/:id/return', controller.returnHardware);
router.get('/issues/active', controller.listActiveIssues);
router.get('/issues/history', controller.listIssueHistory);
router.get('/issues/due-today', controller.listDueToday);
router.put('/issues/:id', controller.updateIssue);
router.delete('/issues/:id', controller.deleteIssue);

module.exports = router;