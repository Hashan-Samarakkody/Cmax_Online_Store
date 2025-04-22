import userModel from "../models/userModel.js";
import validator from 'validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { broadcast } from '../server.js';

const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET);
}

// Route for user login
const loginUser = async (req, res) => {

    try {

        const { email, password } = req.body;

        // Check if user exists or not
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: "User not found!" });
        }

        // Check if password is correct or not
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.json({ success: false, message: "Invalid credentials!" });
        } else {
            const token = createToken(user._id);
            res.json({ success: true, token });
        }

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }

}

// Route for user registration
const registerUser = async (req, res) => {

    try {
        const { name, email, password } = req.body;

        // Check if user already exists or not
        const userExist = await userModel.findOne({ email });
        if (userExist) {
            return res.json({ success: false, message: "User already exists" });
        }

        //  Validate email format and password length
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email!" });

        }

        if (password.length < 8) {
            return res.json({ success: false, message: "Password must be at least 8 characters long!" });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = new userModel({
            name,
            email,
            password: hashedPassword
        });

        // Save user to the database
        const user = await newUser.save();

        // Provide a token to the user
        const token = createToken(user._id);
        // Broadcast the new user
        broadcast({ type: "newUser", user });
        res.json({ success: true, token });

    } catch (error) {

        console.log(error);
        res.json({ success: false, message: error.message });

    }

}

// Route for admin login
const adminLogin = async (req, res) => {

    try {

        const { email, password } = req.body;

        // Check if user exists or not
        if (email === process.env.ADMIN_EMAIL &&
            password === process.env.ADMIN_PASSWORD)
        {
            const token = jwt.sign(email + password, process.env.JWT_SECRET);
            res.json({ success: true, token })
        } else {
            res.json({ success: false, message: "Invalid credentials!" })
        }

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

export { loginUser, registerUser, adminLogin };
