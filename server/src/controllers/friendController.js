const User = require('../models/User');

// Add a new friend by username
const addFriend = async (req, res) => {
    const { username } = req.body;
    const userId = req.user._id;

    try {
        const friendToAdd = await User.findOne({ username: username });
        if (!friendToAdd) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Add friend to current user's list
        await User.findByIdAndUpdate(userId, { $addToSet: { friends: friendToAdd._id } });
        // Add current user to friend's list
        await User.findByIdAndUpdate(friendToAdd._id, { $addToSet: { friends: userId } });

        res.status(200).json({ message: 'Friend added successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { addFriend };