const express=require("express")
const { register, login,logout,makeAdmin} = require("../controller/auth.controller")
const { verifyToken, verifyAdmin } = require("../middleware/verifyToken");

const router=express.Router()

router.post("/register",register)
router.post("/login",login)
router.put("/make-admin", verifyToken, verifyAdmin, makeAdmin)
router.post("/logout", logout);

module.exports=router