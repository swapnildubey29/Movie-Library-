const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const router = express.Router();

// Signup
router.post('/register', async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({ username, email, password: hashedPassword });
    const savedUser = await newUser.save();
    
    //Generating JWT token
    const token = jwt.sign(
      { user: { _id: savedUser._id, username: savedUser.username, email: savedUser.email } },
      process.env.SECRET_KEY,
      { expiresIn: '1h' }
    );
    
    // Set the JWT token as an HTTP-only cookie
    res.cookie('token', token, { httpOnly: true });
    
    return res.status(201).json({ success: true, message: 'Registration successful', user: { email: savedUser.email } });
  } catch (err) {
    console.error('Error during registration:', err.message);  
    return res.status(500).json({ message: 'Server error during registration', error: err.message });
  }
});


// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: 'User not found' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) 
      return res.status(400).json({ message: 'Invalid Password' });

    //Generating JWT token
    const token = jwt.sign(
      { user: { _id: user._id, username: user.username, email: user.email } },
      process.env.SECRET_KEY,
      { expiresIn: '1h' }
    );

    res.cookie('token', token, { httpOnly: true, maxAge: 3600000 }); 
    res.status(200).json({ success: true, message: 'Login successful', user: { email: user.email } });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});


module.exports = router;