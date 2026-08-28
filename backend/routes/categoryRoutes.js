const express = require('express');
const router = express.Router();
const { getCategories, getCategoryProducts } = require('../controllers/categoryController');

router.get('/', getCategories);
router.get('/:id/products', getCategoryProducts);

module.exports = router;
