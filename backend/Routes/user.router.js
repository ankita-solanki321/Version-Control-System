const express = require("express");
const userController = require("../controllers/userController");

const userRouter = express.Router();

userRouter.get("/allUsers" , userController.getAllUsers);
userRouter.post("/signUp" , userController.signUp);
userRouter.post("/login" , userController.login);
userRouter.get("/userProfile/:id" , userController.getUserProfile);
userRouter.put("/updateProfile/:id" , userController.updateUserProfile);
userRouter.delete("/deleteProfile/:id" , userController.deleteUserProfile);
userRouter.put("/follow/:id", userController.followUser);
userRouter.put("/unfollow/:id", userController.unfollowUser);

module.exports = userRouter ;
