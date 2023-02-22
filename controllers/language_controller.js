const translate = require('../utils/translate');

const { Language } = require('../models');

const getAllLanguages = async (req, res) => {
  try {
    const languages = await Language.findAll();

    return res.status(200).send({ data: languages });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ error: translate('internal_server_error', req.hl) });
  }
};

module.exports = {
  getAllLanguages,
};
