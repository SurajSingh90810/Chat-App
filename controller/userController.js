const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const session = require("express-session");
const chatModel = require("../models/chatModel");
const Group = require("../models/groupModel");
const Member = require("../models/memberModel");
const mongoose = require("mongoose");

const registerLoad = (req, res) => {
  res.render("register", { message: "" });
};

const register = async (req, res) => {
  try {
    const passwordHash = await bcrypt.hash(req.body.password, 10);

    const user = new User({
      name: req.body.name,
      email: req.body.email,
      image: "images/" + req.file.filename,
      password: passwordHash,
    });

    await user.save();

    return res.render("register", { message: "Your registration Succesfully" });
  } catch (error) {
    console.log(error.message);
  }
};

const loadLogin = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.log(error.message);
  }
};

const login = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const userData = await User.findOne({ email: email });
    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);

      if (passwordMatch) {
        req.session.user = userData;
        res.cookie(`user`, JSON.stringify(userData));
        res.redirect("/dashboard");
      } else {
        res.render("login", { message: "Email and Password is incorrect!!" });
      }
    } else {
      res.render("login", { message: "Email and Password is incorrect!!" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const logout = async (req, res) => {
  try {
    res.clearCookie("user");
    req.session.destroy();
    res.redirect("/");
  } catch (error) {
    console.log(error.message);
  }
};

const loadDashboard = async (req, res) => {
  try {
    let users = await User.find({ _id: { $nin: [req.session.user._id] } });
    res.render("dashboard", { user: req.session.user, users: users });
  } catch (error) {
    console.log(error.message);
  }
};

const saveChat = async (req, res) => {
  try {
    var chat = new chatModel({
      sender_id: req.body.sender_id,
      receiver_id: req.body.receiver_id,
      message: req.body.message,
    });

    var newChat = await chat.save();
    res
      .status(200)
      .send({ success: true, msg: "Chat Inserted", data: newChat });
  } catch (error) {
    res.status(400).send({ success: false, msg: error.message });
  }
};

const deleteChat = async (req, res) => {
  try {
    await chatModel.deleteOne({ _id: req.body.id });
    res.status(200).send({ success: true });
  } catch (error) {
    res.status(400).send({ success: false, msg: error.message });
  }
};

const updateChat = async (req, res) => {
  try {
    await chatModel.findByIdAndUpdate(req.body.id, {
      $set: {
        message: req.body.message,
      },
    });
    res.status(200).send({ success: true });
  } catch (error) {
    res.status(400).send({ success: false, msg: error.message });
  }
};

const loadGroups = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect("/");
    }
    const groups = await Group.find({ creator_id: req.session.user._id });

    res.render("group", { groups: groups });
  } catch (error) {
    console.log(error.message);
  }
};

const createGroup = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect("/");
    }

    const group = new Group({
      creator_id: req.session.user._id,
      name: req.body.name,
      image: "images/" + req.file.filename, // Changed from "image/" to "images/"
      limit: req.body.limit,
    });
    await group.save();
    const groups = await Group.find({ creator_id: req.session.user._id });

    res.render("group", {
      message: req.body.name + " Group Created Successfully",
      groups: groups,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const getMembers = async (req, res) => {
  try {
    if (!req.session.user) return res.redirect("/");
    if (!req.body.group_id)
      return res
        .status(400)
        .send({ success: false, message: "group_id is required" });

    const groupMembers = await Member.find({
      group_id: req.body.group_id,
    }).select("user_id -_id");

    const allUsers = await User.find({
      _id: { $ne: req.session.user._id },
    }).select("name _id");

    res.status(200).send({
      success: true,
      data: allUsers.map((user) => ({
        ...user.toObject(),
        member: groupMembers.some((m) => m.user_id.equals(user._id))
          ? [{ _id: user._id }]
          : [],
      })),
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ success: false, message: "Error fetching members" });
  }
};

const addMembers = async (req, res) => {
  try {
    if (!req.body.members) {
      res
        .status(200)
        .send({ success: false, msg: "Please select any one Memeber" });
    } else if (req.body.members.length > parseInt(req.body.limit)) {
      res.status(200).send({
        success: false,
        msg: "You can not select more than" + req.body.limit + " Members",
      });
    } else {
      await Member.deleteMany({ group_id: req.body.group_id.trim() });
      var data = [];
      const members = req.body.members;

      for (let i = 0; i < members.length; i++) {
        data.push({
          group_id: req.body.group_id.trim(),
          user_id: members[i],
        });
      }

      await Member.insertMany(data);

      res
        .status(200)
        .send({ success: true, msg: "Members added Successfully" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const updateChatGroup = async (req, res) => {
  try {
    if (parseInt(req.body.limit) < parseInt(req.body.last_limit)) {
      await Member.deleteMany({ group_id: req.body.id });
    }

    let updateObj = {
      name: req.body.name,
      limit: req.body.limit,
    };

    if (req.file !== undefined) {
      updateObj.image = "images/" + req.file.filename;
    }

    await Group.findByIdAndUpdate(
      req.body.id,
      { $set: updateObj },
      { new: true }
    );

    res
      .status(200)
      .send({ success: true, msg: "Chat Group Updated Successfully" });
  } catch (error) {
    res.status(400).send({ success: false, message: error.message });
  }
};

module.exports = {
  register,
  registerLoad,
  login,
  loadLogin,
  loadDashboard,
  logout,
  saveChat,
  deleteChat,
  updateChat,
  loadGroups,
  createGroup,
  getMembers,
  addMembers,
  updateChatGroup,
};
