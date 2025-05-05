const User=require("../models/userModel")
const bcrypt=require("bcrypt")
const session = require("express-session");


const registerLoad=(req,res)=>{
 res.render("register" ,{ message: '' })
}

const register=async(req,res)=>{
    try {
        
        const passwordHash=await bcrypt.hash(req.body.password,10)

      const user=  new User({
            name:req.body.name,
            email:req.body.email,
            image: "images/"+req.file.filename,
            password:passwordHash
        })

        await user.save()

        return res.render("register", {message:"Your registration Succesfully"})


    } catch (error) {
        console.log(error.message)

    }
}

const loadLogin=async(req,res)=>{
    try {
        res.render("login")
    } catch (error) {
        console.log(error.message)
    }
}

const login=async(req,res)=>{
    try {
        const email=req.body.email;
        const password=req.body.password;

        const userData=await User.findOne({email:email})
        if(userData){
           const passwordMatch=await bcrypt.compare(password, userData.password);

           if(passwordMatch){
            req.session.user=userData;
            res.redirect("/dashboard")
           }else{
            res.render("login",{message:"Email and Password is incorrect!!"})

           }

        }else{
            res.render("login",{message:"Email and Password is incorrect!!"})
        }
    } catch (error) {
        console.log(error.message)
    }
}

const logout=async(req,res)=>{
    try {
        req.session.destroy();
        res.redirect("/");
    } catch (error) {
        console.log(error.message)
    }
}

const loadDashboard=async(req,res)=>{
    try {
     let users= await User.find({_id:{$nin:[req.session.user._id]}})
        res.render("dashboard",{user:req.session.user, users:users});
    } catch (error) {
        console.log(error.message)
    }
}

module.exports={
    register,registerLoad,login,loadLogin,loadDashboard,logout
}