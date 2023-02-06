const i18next = require('i18next');

const injectLanguage = function (req, res, next) {
  // hl stands for host language (like en, vi,...)
  // Google use hl to specify language so I use it too :)
  const hl = req.query.hl || i18next.language;

  // Inject lang into req
  req.hl = hl;

  next();
};

module.exports = injectLanguage;
