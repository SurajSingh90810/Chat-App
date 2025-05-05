require("dotenv").config();
const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/chat-app");

const express = require("express");
const app = express();
const http = require("http").Server(app);
const bodyParser = require("body-parser");
const io=require("socket.io")(http)
app.set("view engine", "ejs"); 
app.set("views", "./views");    

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const userRoute = require("./routes/userRoute");
app.use("/", userRoute);

let usp= io.of("/user-namespace")
usp.on("connection",function(socket){
    console.log("User Connected")

    socket.on("disconnect",function(){
        console.log("user Disconnected")
    })
})

http.listen(3000, () => {
    console.log("Server is running on port 3000");
});