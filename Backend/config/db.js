const { default: mongoose } = require("mongoose")


const ConnectDb=async()=>{
    try {
        let res=await mongoose.connect(process.env.MONGO_URL)
        if(res){
            console.log("succefully connected")
        }
    } catch (error) {
        console.log("error in db",error)
    }
}

module.exports=ConnectDb