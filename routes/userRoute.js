const express = require("express");
const user_route = express();
const path = require("path");
const multer = require("multer");
const session = require("express-session");
const auth = require("../middlewares/auth");

const { SESSION_SECRET } = process.env;
user_route.use(session({ secret: SESSION_SECRET }));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/images"));
  },
  filename: function (req, file, cb) {
    const name = Date.now() + "-" + file.originalname;
    cb(null, name);
  },
});

const upload = multer({ storage: storage });

const userController = require("../controller/userController");

user_route.get("/register", auth.isLogout, userController.registerLoad);

user_route.post("/register", upload.single("image"), userController.register);

user_route.get("/", auth.isLogout, userController.loadLogin);
user_route.post("/", userController.login);
user_route.get("/logout", auth.isLogin, userController.logout);
user_route.get("/dashboard", auth.isLogin, userController.loadDashboard);

user_route.post("/save-chat", userController.saveChat);
user_route.post("/delete-chat", userController.deleteChat);

module.exports = user_route;
