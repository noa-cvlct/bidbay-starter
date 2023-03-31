import express from 'express'
import { User, Product, Bid } from '../orm/index.js'

const router = express.Router()

router.get('/api/users/:userId', async (req, res) => {
  const { userId } = req.params
  let user = User.findByPk(userId)
  res.status(200).send(user)
})

export default router
