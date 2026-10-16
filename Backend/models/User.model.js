const mongoose=require('mongoose')

const UserSchema=new mongoose.Schema({
    Name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true,
        unique:true,
        minlength:6
    },
    role:{
        type:String,
        enum:['Admin','User'],
        default:'User'
    }
},
   {timestamps:true}
)

module.exports=mongoose.model('User',UserSchema)