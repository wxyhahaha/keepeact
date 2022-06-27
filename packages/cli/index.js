const { program } = require('commander');
program.version(require('./package.json').version).usage('<command> [options]').command('create', 'create new project');
program.parse(process.argv);
