const express = require('express');
const router = express.Router();
const { getUserOrders, createUser, deleteUser, loginUser } = require('../controllers/userController');

router.post('/login', loginUser);
router.get('/:id/orders', getUserOrders);
router.post('/', createUser);
router.delete('/:id', deleteUser);

module.exports = router;
