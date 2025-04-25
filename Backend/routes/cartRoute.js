import express from 'express'
import { addToCart, updateCart, getUserCart } from '../controllers/cartController.js'
import {orderAndCartAuth} from '../middleware/userAuth.js'

const cartRouter = express.Router()

cartRouter.post('/get',orderAndCartAuth, getUserCart)
cartRouter.post('/add',orderAndCartAuth, addToCart)
cartRouter.post('/update',orderAndCartAuth, updateCart)

export default cartRouter