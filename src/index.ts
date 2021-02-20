#!/usr/bin/env node

import { Command } from 'commander';
const program = new Command();

program
  .command('qiita [options]', 'Import from Qiita::Team')
  .command('esa [options]', 'Import from Esa')
  .command('clean [options]', 'Clean data')
  .command('users', 'Output users data');
program.parse();
