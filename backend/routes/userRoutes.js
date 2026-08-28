const express = require('express');
const router = express.Router();
const { getUserOrders, createUser } = require('../controllers/userController');

router.get('/:id/orders', getUserOrders);
router.post('/', createUser);

module.exports = router;
