declare class Esa {
    dir: string;
    files: {
        [s: string]: string;
    };
    constructor(dir: string);
    dirs(dir?: string): Promise<Esa_Dir[]>;
    getDir(): string;
    loadFiles(dir?: string): Promise<{
        [s: string]: string;
    }>;
}
export default Esa;
