import orderModel from '../models/orderModel.js'
import userModel from '../models/userModel.js'

// Place orders using cash on delivery method
const placeOrder = async (req, res) => {
    try {
        const { userId, items, amount, address } = req.body

        const orderData = {
            userId,
            items,
            amount,
            address,
            paymentMethod: 'cod',
            payment: false,
            date: Date.now()
        }

        const newOrder = new orderModel(orderData)
        await newOrder.save()

        await userModel.findByIdAndUpdate(userId, { cartData: {} })

        res.json({ success: true, message: 'Order Placed Successfully' })

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

// Place orders using Stripe method
const placeOrderStripe = async (req, res) => {

}

// Place orders using Razorpay method
const placeOrderRazorpay = async (req, res) => {

}

//  All orders data for admin panel
const allOrders = async (req, res) => {

}

// User order data for frontend
const userOrders = async (req, res) => {
    try {

        const { userId } = req.body

        const orders = await orderModel.find({ userId })
        res.json({ success: true, orders })


    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })

    }

}

// Update order staus from admin panel
const updateStatus = async (req, res) => {

}

export { placeOrder, placeOrderStripe, placeOrderRazorpay, allOrders, userOrders, updateStatus }