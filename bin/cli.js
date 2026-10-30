#!/usr/bin/env node

import { program } from 'commander';
import { organizeSamples } from '../src/organizer.js';
import chalk from 'chalk';

program
  .name('sample-organizer')
  .description('Organize messy audio sample folders into categorized directories based on filenames and tags.')
  .version('1.0.0');

program
  .argument('<source>', 'Source directory containing messy samples')
  .option('-d, --dest <dir>', 'Destination directory (default: <source>/organized)')
  .option('--dry-run', 'Show what would be done without moving/copying files')
  .option('--copy', 'Copy files instead of moving them')
  .option('--no-recursive', 'Do not scan subdirectories')
  .option('--index', 'Generate an index.json file in the destination')
  .option('-c, --config <file>', 'Path to custom categories config JSON')
  .action(async (source, options) => {
    try {
      console.log(chalk.blue('Sample Pack Organizer'));
      console.log(chalk.gray(`Source: ${source}`));
      console.log(chalk.gray(`Mode: ${options.dryRun ? 'DRY RUN' : options.copy ? 'COPY' : 'MOVE'}`));
      
      await organizeSamples({
        source,
        dest: options.dest,
        dryRun: options.dryRun || false,
        copy: options.copy || false,
        recursive: options.recursive !== false,
        generateIndex: options.index || false,
        configPath: options.config
      });
      
      console.log(chalk.green('\nDone!'));
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

program.parse();
