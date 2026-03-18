require("dotenv").config()
const express = require("express")
const cors = require("cors")
const authRoutes = require("./routes/authRoutes.js")
const connectDB = require("./db");

const app = express()

app.use(cors())
app.use(express.json())
app.use('/api/auth', authRoutes);


const startServer = async () => {
    try {
        await connectDB();
        app.listen(process.env.PORT, () => {
            console.log("Server listening on port: " + process.env.PORT);
        });

    } catch (err) {
        console.log("Failed to connect to DB", err);
    }
};


startServer();


