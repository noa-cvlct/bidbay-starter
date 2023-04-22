import authMiddleware from '../middlewares/auth.js'
import { Bid, Product } from '../orm/index.js'
import express from 'express'
import { getDetails } from '../validators/index.js'

const router = express.Router()

router.delete('/api/bids/:bidId', authMiddleware, async (req, res) => {
  const { bidId } = req.params;

  let bid = await Bid.findByPk(bidId);

  if (!bid) {
    res.status(404).json({
      'error': 'Bid not found'
    })
    return
  }

  if (bid.bidderId != req.user.id && !req.user.admin) {
    res.status(403).json({
      'error': 'User not granted'
    })
    return
  }

  await bid.destroy()

  res.status(204).json()
})

router.post('/api/products/:productId/bids', authMiddleware, async (req, res) => {
  const { price } = req.body;
  const { productId } = req.params;

  let product = await Product.findByPk(productId)

  if (!product) {
    res.status(404).json({
      'error': 'Product not found'
    })
    return
  }

  let bids = await Bid.findAll({ where: { productId: product.id } })

  const max = bids.length > 0
    ? bids.reduce((max, bid) => max.price > bid.price ? max : bid).price
    : product.originalPrice;

  if (price <= max) {
    res.status(409).json({
      'error': 'Bid price is lower than expected' 
    })
    return
  }

  try {
    let bid = await Bid.create({
      'productId': product.id,
      'bidderId': req.user.id,
      'price': price,
      'date': new Date()
    })

    res.status(201).json(bid)
  } catch (e) {
    res.status(400).json({
      'error': 'Invalid or missing fields', 
      'details': getDetails(e)
    })
  }

  res.status(201).json()
})

export default router
