import express from 'express'
import { Product, Bid, User } from '../orm/index.js'
import authMiddleware from '../middlewares/auth.js'
import { getDetails } from '../validators/index.js'

const router = express.Router()

router.get('/api/products', async (req, res, next) => {
  let products = await Product.findAll({
    attributes: ['id', 'name', 'description', 'category', 'originalPrice', 'pictureUrl', 'endDate'],
    include: [{
      model: User,
      as: 'seller',
      attributes: ['id', 'username']
    }, {
      model: Bid,
      as: 'bids',
      attributes: ['id', 'price', 'date']
    }]
  });
  res.status(200).json(products)
})

router.get('/api/products/:productId', async (req, res) => {
  const { productId } = req.params
  let product = await Product.findByPk(productId, {
    attributes: ['id', 'name', 'description', 'category', 'originalPrice', 'pictureUrl', 'endDate'],
    include: [{
      model: User,
      as: 'seller',
      attributes: ['id', 'username']
    }, {
      model: Bid,
      as: 'bids',
      attributes: ['id', 'price', 'date']
    }]
  })
  if (product)
    res.status(200).json(product)
  else
    res.status(404).json({ "error": "Product not found" })
})

// You can use the authMiddleware with req.user.id to authenticate your endpoint ;)

router.post('/api/products', (req, res) => {
  res.status(201).send()

  // authMiddleware
  // req.user.id
})

router.put('/api/products/:productId', async (req, res) => {
  res.status(200).send()
})

router.delete('/api/products/:productId', async (req, res) => {
  res.status(204).send()
})

export default router
