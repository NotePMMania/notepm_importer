#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const program = new commander_1.Command();
program
    .command('qiita [options]', 'Import from Qiita::Team')
    .command('esa [options]', 'Import from Esa')
    .command('kibela [options]', 'Import from Kibela')
    .command('docbase [options]', 'Import from Docbase')
    .command('clean [options]', 'Clean data')
    .command('users', 'Output users data');
program.parse();
