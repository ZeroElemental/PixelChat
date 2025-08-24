const User = require('../models/User');

const getFriends = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('friends', '-password');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user.friends);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
module.exports = { getFriends };