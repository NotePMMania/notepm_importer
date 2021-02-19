#!/usr/bin/env node

import { Command } from 'commander';
const program = new Command();

program
  .command('qiita [directory_path]', 'Import from Qiita::Team')
  .command('clean [directory_path]', 'Clean data')
  .command('users', 'Output users data');
program.parse();
