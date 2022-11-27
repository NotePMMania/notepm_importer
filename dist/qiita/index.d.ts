/// <reference types="node" />
import Article from './article';
import Group from './group';
import Project from './project';
declare class QiitaTeam {
    qiitaToken: string;
    dir: string;
    articles: Article[];
    groups: Group[];
    projects: Project[];
    constructor(dir: string, qiitaToken: string);
    sleep(ms: number): Promise<unknown>;
    load(): Promise<void[]>;
    loadArticles(): Promise<void>;
    loadGroups(): Promise<void>;
    loadProjects(): Promise<void>;
    loadFile(dir: string): Promise<any[]>;
    getDir(): string;
    getImage(): string[];
    getAttachment(): string[];
    regexpImage(str: string): string[];
    regexpAttachment(str: string): string[];
    upload(page: Project | Article): Promise<void>;
    downloadAttachment(): Promise<void>;
    createDir(): Promise<void>;
    downloadImage(): Promise<void>;
    attachmentDir(): string;
    filePath(url: string): string;
    download(url: string): Promise<boolean>;
    getBinary(url: string): Promise<Buffer>;
}
export default QiitaTeam;
