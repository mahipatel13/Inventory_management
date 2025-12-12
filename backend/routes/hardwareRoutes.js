const express = require('express');
const router = express.Router();
const controller = require('../controllers/hardwareController');
const authMiddleware = require('../middleware/authMiddleware');  // Update this line

// =====================
// Hardware inventory
// =====================
router.get('/', authMiddleware, controller.listHardware);
router.post('/', authMiddleware, controller.createHardware);
router.put('/:id', authMiddleware, controller.updateHardware);
router.delete('/:id', authMiddleware, controller.deleteHardware);

// =====================
// Hardware issues
// =====================
router.post('/issues', authMiddleware, controller.issueHardware);
router.post('/issues/:id/return', authMiddleware, controller.returnHardware);
router.get('/issues/active', authMiddleware, controller.listActiveIssues);
router.get('/issues/history', authMiddleware, controller.listIssueHistory);
router.get('/issues/due-today', authMiddleware, controller.listDueToday);
router.put('/issues/:id', authMiddleware, controller.updateIssue);
router.delete('/issues/:id', authMiddleware, controller.deleteIssue);

module.exports = router;