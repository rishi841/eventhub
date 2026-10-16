require("dotenv").config()
const express=require ("express");
const ConnectDb = require("./config/db");
const app= express()
const UserRoute=require("./routes/auth.routes")
const EventRoutes=require("./routes/event.routes")
const cookieParser = require('cookie-parser')
const cors=require("cors")
app.use(cors({
    origin: "http://localhost:5173",
    credentials:true
}))

ConnectDb()
app.use(cookieParser())
app.use(express.json())


const PORT=process.env.PORT||5000

app.use("/api/auth", UserRoute)
app.use("/api/events",EventRoutes)

app.listen(PORT,()=>{
    console.log("server is running on port 3000")
})