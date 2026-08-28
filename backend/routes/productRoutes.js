const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  createProductReview
} = require('../controllers/productController');

router.get('/', getProducts);
router.post('/', createProduct);

router.get('/:id', getProductById);
router.put('/:id', updateProduct);

router.post('/:id/reviews', createProductReview);

module.exports = router;
