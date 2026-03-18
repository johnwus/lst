const User = require('../models/User.js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        const isMatch =  await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid password" });
        }

        const token = jwt.sign(
            {userId: user._id},
            process.env.JWT_SECRET,
            {expiresIn: process.env.JWT_EXPIRES_IN}
        )

        console.log("User has successfully logged in:", user);

        res.status(200).json({ message: "Login successful", token });

    } catch (err) {
        res.status(500).json({ message: "Error logging in", error: err.message });
    }
};

const register = async (req, res) => {
    const { username, email, password } = req.body;
    if (!email.endsWith("@gmail.com")) return res.status(400).json( { message: "Email must end in @gmail.com" });

    try {
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const newUser = new User({ username, email, password });
        await newUser.save();
        console.log("User has successfully registered:", newUser);


        res.status(201).json({ message: "User registered", user: newUser });


    } catch (err) {
        res.status(500).json({ message: "Error registering", error: err.message });
    }
};

const me = async (req, res) => {
    try {
        const thisUser = await User.findById(req.user.userId);

        res.json({
            message: "User fetched successfully",
            thisUser
        });
    } catch (err) {
        res.status(500).json({ message: "Error fetching user" });
    }
}

module.exports = {
    login,
    register,
    me
};