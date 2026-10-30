const jwt = require("jsonwebtoken");
const UserModel = require("../models/User.model");

const verifyToken = (req, res, next) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({
                message: "No token provided, please login"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

        req.user = decoded; // { id, role }
        next();

    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
};

const verifyAdmin = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(403).json({
                message: "Access denied. Admins only."
            });
        }

        const user = await UserModel.findById(req.user.id);

        if (!user || user.role !== "admin") {
            return res.status(403).json({
                message: "Access denied. Admins only."
            });
        }

        next();
    } catch (error) {
        console.log("verifyAdmin error", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

module.exports = { verifyToken, verifyAdmin };