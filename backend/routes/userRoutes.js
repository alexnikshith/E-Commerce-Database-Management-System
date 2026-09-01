const express = require('express');
const router = express.Router();
const { getUserOrders, createUser, deleteUser, loginUser, getAllUsers } = require('../controllers/userController');

router.get('/', getAllUsers);
router.post('/login', loginUser);
router.get('/:id/orders', getUserOrders);
router.post('/', createUser);
router.delete('/:id', deleteUser);

module.exports = router;

