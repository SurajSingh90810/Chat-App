const mongoose=require("mongoose")

const groupSchema=new mongoose.Schema({
  creator_id:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User"
  },
  name:{
    type:String,
    required:true
  },

  image:{
    type:String,
    required:true
  },
  limit:{
    type:Number,
    required:true
  }
},{timestamps:true})

module.exports=mongoose.model("Group",groupSchema)