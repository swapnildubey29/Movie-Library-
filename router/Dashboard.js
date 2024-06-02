const express = require("express");
const router = express.Router();
const axios = require("axios");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

const OMDB_API_KEY = "50771f50";
const SECRET_KEY = process.env.SECRET_KEY;

//Middleware to authenticate user
const authenticateUser = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: Missing token" });
  }

  try {
    const decoded = jwt.verify(token.split(" ")[1], process.env.SECRET_KEY);

    console.log("Decoded token:", decoded);
    if (!decoded.user || !decoded.user._id) {
      throw new Error("Invalid token structure");
    }

    req.user = { _id: decoded.user._id }; 
    next();
  } catch (error) {
    console.error("Error authenticating user:", error);
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

//Searching movies
router.get("/search", async (req, res) => {
  const query = req.query.q;
  const url = `http://www.omdbapi.com/?apikey=${OMDB_API_KEY}&s=${query}`;

  try {
    const response = await axios.get(url);

    if (response.data.Response === "True") {
      res.json(response.data.Search);
    } else {
      res.status(404).json({ message: "Movies not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error fetching movies", error });
  }
});

// fetching user lists
router.get("/lists", async (req, res) => {
  try {
    let lists;
    const token = req.headers.authorization;
    if (token) {
      // If the user is authenticated, include both public and private lists
      const decoded = jwt.verify(token.split(" ")[1], process.env.SECRET_KEY);
      const user = await User.findById(decoded.user._id);
      lists = user.lists;
    } else {
      // If the user is not authenticated, include only public lists
      lists = await User.find({ "lists.isPublic": true }).select("lists");
    }
    res.json(lists);
  } catch (error) {
    console.error("Error fetching lists:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Route for creating a new list
router.post("/lists", authenticateUser, async (req, res) => {
  const { title, movies, isPublic } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const newList = { title, movies, isPublic };
    user.lists.push(newList);
    await user.save();

    if (isPublic) {
      const allUsersExceptCurrent = await User.find({ _id: { $ne: req.user._id } }); // Exclude the current user
      allUsersExceptCurrent.forEach(async (u) => {
        u.lists.push(newList);
        await u.save();
      });
    }
    

    res.status(201).json({ message: "List created successfully" });
  } catch (error) {
    console.error("Error creating list:", error);
    res.status(500).json({ message: "Server error" });
  }
});

//Adding movie to aAlist
router.post("/lists/:listId/addMovie", authenticateUser, async (req, res) => {
  const listId = req.params.listId;
  const { movieTitle } = req.body;
  try {
      const user = await User.findById(req.user._id);
      const list = user.lists.id(listId);
      if (list.movies.includes(movieTitle)) {
          return res
              .status(400)
              .json({ message: "Movie already exists in the list" });
      }
      list.movies.push(movieTitle);
      await user.save();
      res.status(200).json({ message: "Movie added to the list successfully" });
  } catch (error) {
      console.error("Error adding movie to list:", error);
      res.status(500).json({ message: "Server error" });
  }
});


//updating list
router.put("/lists/:listId", authenticateUser, async (req, res) => {
  const listId = req.params.listId;
  const { title, isPublic } = req.body;
  try {
      const user = await User.findById(req.user._id);
      const list = user.lists.id(listId);
      if (!list) {
          return res.status(404).json({ message: "List not found" });
      }
      list.title = title;
      list.isPublic = isPublic;
      await user.save();
      res.status(200).json({ message: "List updated successfully" });
  } catch (error) {
      console.error("Error updating list:", error);
      res.status(500).json({ message: "Server error" });
  }
});

//deleting list
router.delete("/lists/:listId", authenticateUser, async (req, res) => {
  const listId = req.params.listId;
  try {
      const user = await User.findById(req.user._id);
      const listIndex = user.lists.findIndex(list => list.id === listId);
      if (listIndex === -1) {
          return res.status(404).json({ message: "List not found" });
      }
      user.lists.splice(listIndex, 1);
      await user.save();
      res.status(200).json({ message: "List deleted successfully" });
  } catch (error) {
      console.error("Error deleting list:", error);
      res.status(500).json({ message: "Server error" });
  }
});



module.exports = router;
