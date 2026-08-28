const express = require('express');
const router = express.Router();
const {
  getOrders,
  getOrderById,
  createOrder,
  addOrderItem,
  deleteOrder,
  updateOrderStatus
} = require('../controllers/orderController');

router.get('/', getOrders);
router.post('/', createOrder);

router.get('/:id', getOrderById);
router.delete('/:id', deleteOrder);
router.put('/:id/status', updateOrderStatus);
router.post('/:id/items', addOrderItem);

module.exports = router;
