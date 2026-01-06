#!/usr/bin/env node

/**
 * CLI Entry Point
 * Icing on the L4yercak3 - The sweet finishing touch for your Layer Cake integration
 */

const { Command } = require('commander');
const { showLogo } = require('../src/logo');
const chalk = require('chalk');

// Import commands
const loginCommand = require('../src/commands/login');
const logoutCommand = require('../src/commands/logout');
const statusCommand = require('../src/commands/status');
const spreadCommand = require('../src/commands/spread');

// Create CLI program
const program = new Command();

program
  .name('l4yercak3')
  .description('Icing on the L4yercak3 - The sweet finishing touch for your Layer Cake integration')
  .version(require('../package.json').version);

// Register commands
program
  .command(loginCommand.command)
  .description(loginCommand.description)
  .action(loginCommand.handler);

program
  .command(logoutCommand.command)
  .description(logoutCommand.description)
  .action(logoutCommand.handler);

program
  .command('auth')
  .description('Authentication commands')
  .addCommand(
    new Command('status')
      .description(statusCommand.description)
      .action(statusCommand.handler)
  );

program
  .command(spreadCommand.command)
  .description(spreadCommand.description)
  .action(spreadCommand.handler);

// Show logo and welcome message if no command provided
if (process.argv.length === 2) {
  console.log(''); // initial spacing
  showLogo(true);
  console.log(chalk.bold.hex('#9F7AEA')('  🍰 Welcome to Icing on the L4yercak3! 🍰\n'));
  console.log(chalk.gray('  The sweet finishing touch for your Layer Cake integration\n'));
  program.help();
}

// Parse arguments
program.parse(process.argv);
