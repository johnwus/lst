const jwt = require("jsonwebtoken");

function auth(req, res, next){
    const header = req.headers.authorization;
    console.log("Headers:", req.headers);
    if (!header) {
        return res.status(401).json({ message: "No token provided" });
    }
    const token = header.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(decoded);
        req.user = decoded;
        next();
    }catch(err){
        res.status(401).json({message: "Unable to login"});
    }
}

module.exports = auth;