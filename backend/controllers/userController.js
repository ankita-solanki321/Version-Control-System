// ACTUAL FUNCTIONALITY
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");
var ObjectId = require("mongodb").ObjectId; // why we use this bcz when we fetching Id from url so we have to convert this in mongodb ID formate bcz agar hu use string pass karenege to its not a match

dotenv.config();
const uri = process.env.MONGODB_URI;

let client;

// async function connectClient() {
//   if (!client) {
//     client = new MongoClient(uri); // ✅ no options needed
//     await client.connect();
//     console.log("MongoDb Connected!");
//   }
// }

async function connectClient() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
    console.log("MongoDb Connected!");
  }
  return client;
}

module.exports = { connectClient, client };

function isValidObjectId(id) {
  return ObjectId.isValid(id);
}

async function buildUserProfile(usersCollection, userId) {
  const objectId = new ObjectId(userId);
  const user = await usersCollection.findOne({ _id: objectId });

  if (!user) {
    return null;
  }

  const followersCount = await usersCollection.countDocuments({
    followedUsers: objectId,
  });
  const followingCount = user.followedUsers ? user.followedUsers.length : 0;

  return {
    ...user,
    followersCount,
    followingCount,
  };
}

async function signUp(req, res) {
  const { username, password, email } = req.body;
  try {
        const client = await connectClient();
    const db = client.db("Github-clone");
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({ username });
    if (user) {
      return res.status(400).json({ message: "User already exists!" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt); //this  is the hashed password which saved on database

    const newUser = {
      username,
      password: hashedPassword,
      email,
      repositories: [],
      followedUsers: [],
      starRepos: [],
    };

    const result = await usersCollection.insertOne(newUser);

    const token = jwt.sign(
      { id: result.insertedId },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" }
    );
    res.json({ token, userId: result.insertedId });
  } catch (err) {
    console.error("Error during signup : ", err.message);
    res.status(500).send("Server error");
  }
}

async function login(req, res) {
  const { email, password } = req.body;
  try {
       const client = await connectClient();
    const db = client.db("Github-clone");
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials!" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials!" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "1h",
    });
    res.json({ token, userId: user._id });
  } catch (err) {
    console.error("Error during login : ", err.message);
    res.status(500).send("Server error!");
  }
}

async function getAllUsers (req,res) {
   try{
       const client = await connectClient();
    const db = client.db("Github-clone");
    const usersCollection = db.collection("users");
    
    const users = await usersCollection.find({}).toArray(); // why we used this .toArray() ---> bcz when we fetch from databse we get data in form of object so we have to convert it into javascript object explicitly
    res.json(users);
   }catch(err){
      console.error("Error during login : ", err.message);
    res.status(500).send("Server error!");
   }
}


//INDIVIDUAL USER PROFILE
async function getUserProfile(req, res) {
  const currentID = req.params.id;

  try {
    if (!isValidObjectId(currentID)) {
      return res.status(400).json({ message: "Invalid user id!" });
    }

       const client = await connectClient();
    const db = client.db("Github-clone");
    const usersCollection = db.collection("users");

    const user = await buildUserProfile(usersCollection, currentID);

    if (!user) {
    return res.status(404).json({ message: "User not found!" });
  }

  res.send(user);
  
  } catch (err) {
    console.error("Error during fetching : ", err.message);
    res.status(500).send("Server error!");
  }
}

async function updateUserProfile(req, res) {
  const currentID = req.params.id;
  const { email, password } = req.body;

  try {
       const client = await connectClient();
    const db = client.db("Github-clone");
    const usersCollection = db.collection("users");

    let updateFields = { email };
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updateFields.password = hashedPassword;
    }

    const result = await usersCollection.findOneAndUpdate(
      {
        _id: new ObjectId(currentID),
      },
      { $set: updateFields },
      { returnDocument: "after" } // after updation result dikh jane chahiye
    );
    if (!result.value) {
      return res.status(404).json({ message: "User not found!" });
    }

    res.send(result.value);
  } catch (err) {
    console.error("Error during updating : ", err.message);
    res.status(500).send("Server error!");
  }
}

async function deleteUserProfile(req, res) {
  const currentID = req.params.id;

  try {
       const client = await connectClient();
    const db = client.db("Github-clone");
    const usersCollection = db.collection("users");

    const result = await usersCollection.deleteOne({
      _id: new ObjectId(currentID),
    });

    if (result.deleteCount == 0) {
      return res.status(404).json({ message: "User not found!" });
    }

    res.json({ message: "User Profile Deleted!" });
  } catch (err) {
    console.error("Error during updating : ", err.message);
    res.status(500).send("Server error!");
  }
}

// follow - unfollow 
 async function followUser(req, res) {
    const currentUserId = req.body.currentUserId;
    const targetUserId = req.params.id;

    try {
      if (!isValidObjectId(currentUserId) || !isValidObjectId(targetUserId)) {
        return res.status(400).json({ message: "Invalid user id!" });
      }

      const client = await connectClient();
      const db = client.db("Github-clone");
      const usersCollection = db.collection("users");

      if (currentUserId === targetUserId) {
        return res.status(400).json({ message: "You cannot follow yourself!" });
      }

      const result = await usersCollection.updateOne(
        { _id: new ObjectId(currentUserId) },
        { $addToSet: { followedUsers: new ObjectId(targetUserId) } }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ message: "Current user not found!" });
      }

      const targetUser = await buildUserProfile(usersCollection, targetUserId);

      if (!targetUser) {
        return res.status(404).json({ message: "Target user not found!" });
      }

      res.json({ message: "User followed successfully!", targetUser });
    } catch (err) {
      console.error("Error during follow: ", err.message);
      res.status(500).send("Server error!");
    }
  }

  async function unfollowUser(req, res) {
    const currentUserId = req.body.currentUserId;
    const targetUserId = req.params.id;

    try {
      if (!isValidObjectId(currentUserId) || !isValidObjectId(targetUserId)) {
        return res.status(400).json({ message: "Invalid user id!" });
      }

      const client = await connectClient();
      const db = client.db("Github-clone");
      const usersCollection = db.collection("users");

      const result = await usersCollection.updateOne(
        { _id: new ObjectId(currentUserId) },
        { $pull: { followedUsers: new ObjectId(targetUserId) } }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ message: "Current user not found!" });
      }

      const targetUser = await buildUserProfile(usersCollection, targetUserId);

      if (!targetUser) {
        return res.status(404).json({ message: "Target user not found!" });
      }

      res.json({ message: "User unfollowed successfully!", targetUser });
    } catch (err) {
      console.error("Error during unfollow: ", err.message);
      res.status(500).send("Server error!");
    }
  }




module.exports ={
    getAllUsers,
    signUp ,
    login,
    getUserProfile,
    updateUserProfile,
    deleteUserProfile,
    followUser,
    unfollowUser

}
