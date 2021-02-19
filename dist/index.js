#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const program = new commander_1.Command();
program
    .command('qiita [directory_path]', 'Import from Qiita::Team')
    .command('clean [directory_path]', 'Clean data')
    .command('users', 'Output users data');
program.parse();
