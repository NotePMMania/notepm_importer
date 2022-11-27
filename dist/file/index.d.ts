/// <reference types="node" />
import puppeteer from 'puppeteer-core';
declare class Esa {
    domain: string;
    dir: string;
    browser: puppeteer.Browser | null;
    files: {
        [s: string]: string;
    };
    constructor(domain: string, dir: string);
    dirs(dir?: string): Promise<Esa_Dir[]>;
    downloadImage(): Promise<void>;
    getImage(): string[];
    createDir(): Promise<void>;
    attachmentDir(): string;
    getDir(): string;
    loadFiles(dir?: string): Promise<{
        [s: string]: string;
    }>;
    launchChrome(): Promise<boolean>;
    open(): Promise<void>;
    close(): void;
    getUrl(): string;
    getChromePath(): Promise<string>;
    download(url: string): Promise<boolean>;
    filePath(url: string): string;
    getBinary(url: string): Promise<Buffer>;
}
export default Esa;
