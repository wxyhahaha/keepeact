function existsSync(path) {
  const fs = require('fs');
  return fs.existsSync(path);
}

module.exports = {
  existsSync,
};
