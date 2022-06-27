const { existsSync } = require('./utils');
const [fileName] = process.argv.slice(2);
const config = require('./config');
function download(path) {
  console.log(`${path} 生成中....`);
  const d = require('download-git-repo');
  d(config.default, path, { clone: true }, function (err) {
    err ? console.log(err) : console.log('生成成功!');
  });
}

if (existsSync(fileName)) {
  console.log(`${fileName} 已存在`);
} else {
  download(fileName);
}
