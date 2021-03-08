#!/usr/bin/env node

import { Command } from 'commander';
const program = new Command();

program
  .command('qiita [options]', 'Import from Qiita::Team')
  .command('esa [options]', 'Import from Esa')
  .command('kibela [options]', 'Import from Kibela')
  .command('docbase [options]', 'Import from Docbase')
  .command('file [options]', 'Import from directory')
  .command('word [options]', 'Import from word files')
  .command('csv [options]', 'Import from CSV file')
  .command('confluence [options]', 'Import from Confluence')
  .command('clean [options]', 'Clean data')
  .command('users', 'Output users data');
program.parse();
