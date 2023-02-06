const { User, Role } = require('../models');
const translate = require('../utils/translate');

const getUserInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['type'],
        },
      ],
    });

    // Add roleType to user object and remove role object
    user.dataValues.roleType = user.role.type;
    delete user.dataValues.role;

    res.status(200).send({ data: user });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: translate('internal_server_error', req.hl) });
  }
};

module.exports = {
  getUserInfo,
};
