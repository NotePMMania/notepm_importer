declare class Docbase {
    dir: string;
    contents: {};
    groups: Set<unknown>;
    dirs: never[];
    images: never[];
    constructor(dir: string);
    loadImageFile(): Promise<void>;
    loadFiles(): Promise<void>;
    replaceContent(body: any): any;
}
export default Docbase;
