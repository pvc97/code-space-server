const i18next = require('i18next');

function translate(key, lang) {
  const options = {};
  if (lang) {
    options.lng = lang;
  }

  return i18next.t(key, options);
}

module.exports = translate;
