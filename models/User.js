const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    lists: [
        {
            title: String,
            movies: [String],
            isPublic: Boolean
        }
    ]
});

module.exports = mongoose.model('User', UserSchema);