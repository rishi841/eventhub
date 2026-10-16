const mongoose=require("mongoose")

const EventSchema=new mongoose.Schema({
    title:{
        type:String,
        required:true,
        trim:true
    },
    description:{
         type:String,
        required:true
    },
    date:{
        type:Date,
        required:true
    },
    venue:{
        type:String,
        required:true
    },
    capacity:{
        type:Number,
        required:true,
        min:1
    },
    registeredUsers:[
        {
          type:mongoose.Schema.Types.ObjectId,
          ref:'User'
        }
    ],
      waitlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
     createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
},
{timestamps:true}
)
 
module.exports=mongoose.model('Event',EventSchema)