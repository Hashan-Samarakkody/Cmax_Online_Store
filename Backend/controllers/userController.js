import userModel from "../models/userModel.js";
import validator from 'validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET);
}

// Route for user login
const loginUser = async (req, res) => {
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
        res.json({ success: true, token});

    } catch (error) {

        console.log(error);
        res.json({ success: false, message: error.message });

    }

}

// Route for admin login
const adminLogin = async (req, res) => {
}

export { loginUser, registerUser, adminLogin };
