// server/src/controllers/friendController.js
const User = require('../models/User');

// Send a friend request
const sendFriendRequest = async (req, res) => {
    const { username } = req.body;
    const senderId = req.user._id;

    try {
        const receiver = await User.findOne({ username: username });
        if (!receiver) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Add receiver to sender's sent requests
        await User.findByIdAndUpdate(senderId, { $addToSet: { sentFriendRequests: receiver._id } });
        // Add sender to receiver's received requests
        await User.findByIdAndUpdate(receiver._id, { $addToSet: { receivedFriendRequests: senderId } });

        res.status(200).json({ message: 'Friend request sent' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Accept a friend request
const acceptFriendRequest = async (req, res) => {
    const { requestFromId } = req.body; // ID of the user who sent the request
    const currentUserId = req.user._id;

    try {
        // Add each user to the other's friends list
        await User.findByIdAndUpdate(currentUserId, { $addToSet: { friends: requestFromId } });
        await User.findByIdAndUpdate(requestFromId, { $addToSet: { friends: currentUserId } });

        // Remove the request from both users' request lists
        await User.findByIdAndUpdate(currentUserId, { $pull: { receivedFriendRequests: requestFromId } });
        await User.findByIdAndUpdate(requestFromId, { $pull: { sentFriendRequests: currentUserId } });
        
        res.status(200).json({ message: 'Friend request accepted' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const getFriendRequests = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('receivedFriendRequests', 'username email');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user.receivedFriendRequests);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// You can create a similar 'rejectFriendRequest' function that just uses $pull

module.exports = { sendFriendRequest, acceptFriendRequest, getFriendRequests  };