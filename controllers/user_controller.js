const { User } = require('../models');

const getUserInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.scope(User.withoutPassword).findByPk(userId);

    res.status(200).send({ data: user });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: INTERNAL_SERVER_ERROR_MESSAGE });
  }
};

module.exports = {
  getUserInfo,
};
