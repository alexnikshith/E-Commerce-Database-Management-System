const express = require('express');
const router = express.Router();
const {
  getOrders,
  getOrderById,
  createOrder,
  addOrderItem
} = require('../controllers/orderController');

router.get('/', getOrders);
router.post('/', createOrder);

router.get('/:id', getOrderById);
router.post('/:id/items', addOrderItem);

module.exports = router;
