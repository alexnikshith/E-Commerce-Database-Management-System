const express = require('express');
const router = express.Router();
const { getUserOrders, createUser, deleteUser } = require('../controllers/userController');

router.get('/:id/orders', getUserOrders);
router.post('/', createUser);
router.delete('/:id', deleteUser);

module.exports = router;
