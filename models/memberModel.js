const mongoose=require("mongoose")

const memberSchema=new mongoose.Schema({
  group_id:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Group"
  },
  user_id:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User"
  },

},{timestamps:true})

module.exports=mongoose.model("Member",memberSchema)