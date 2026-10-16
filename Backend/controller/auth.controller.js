const UserModel = require("../models/User.model");
const bcrypt=require("bcrypt")
const jwt=require("jsonwebtoken")

const register = async (req, res) => {
    try {
        const { Name, email, password } = req.body;

        if (!Name || !email || !password) {
            return res.status(400).json({
                message: "Invalid credentials! All fields are required."
            });
        }

        const existingUser=await UserModel.findOne({email});
        if(existingUser){
            return res.status(400).json({
                message:"user already registerd"
            })
        }

        const hashPass = await bcrypt.hash(password, 10);

        const newUser = await UserModel.create({
            Name,
            email,
            password: hashPass
        });

        const token = jwt.sign(
            { id: newUser._id, role:newUser.role },
            process.env.JWT_SECRET_KEY,
            { expiresIn: "2d" }
        );

        res.cookie("token", token);

        return res.status(201).json({
            message: "User created successfully",
            user: newUser
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};


const login=async(req,res)=>{
    try {
        let {email,password}=req.body;
        if(!email ||!password){
            return res.status(400).json({
                message:"all field are required"
            })
        }
        let User=await UserModel.findOne({
            email
        })
        if(!User){
            return res.status(404).json({
                message:"user not found"
            })
        }
        let ComparePass=await bcrypt.compare(password,User.password)
        if(!ComparePass){
            return res.status(400).json({
                message:"unauthorised!incorrect Password"
            })
        }
        let token=jwt.sign({id: User._id,role: User.role},process.env.JWT_SECRET_KEY,{expiresIn:"2d"})
        res.cookie("token",token)

       return res.status(200).json({
        message: "user logged in",
        user: {
        id: User._id,
        name: User.Name,
        email: User.email,
        role: User.role  
    }
});
    } catch (error) {
         console.log("error",error)
        return res.status(500).json({
            message:"internal server error"
        })
    }
}

const logout = (req, res) => {
    res.clearCookie("token");
    return res.status(200).json({
        message: "Logged out successfully"
    });
};
const makeAdmin = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await UserModel.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.role === "admin") {
            return res.status(400).json({ message: "User is already an admin" });
        }

        user.role = "admin";
        await user.save();

        return res.status(200).json({
            message: `${user.Name} ab admin hai`
        });

    } catch (error) {
        console.log("error", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
module.exports={
    register,
    login,
    logout,
    makeAdmin
}