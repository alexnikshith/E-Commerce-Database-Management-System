const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  createProductReview,
  deleteProduct,
  seedProducts
} = require('../controllers/productController');

router.get('/', getProducts);
router.post('/', createProduct);
router.post('/seed', seedProducts);

router.get('/:id', getProductById);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

router.post('/:id/reviews', createProductReview);

module.exports = router;

