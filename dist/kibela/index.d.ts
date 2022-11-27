declare class Kibela {
    dir: string;
    contents: {};
    groups: Set<unknown>;
    dirs: never[];
    constructor(dir: string);
    load(): Promise<void>;
    loadFiles(dir?: string): Promise<{
        name: string;
        dirs: never[];
    }[]>;
}
export default Kibela;
