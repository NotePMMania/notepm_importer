import NotePM from './index';

class Folder {
  static NotePM: NotePM;

  public folder_id: number = 0;
  public name: string = '';
  public parent_folder_id: number | null = null;

  constructor(params: notePM_Folder) {
    this.folder_id = params.folder_id;
    this.name = params.name;
    this.parent_folder_id = params.parent_folder_id;
  }

  async findOrCreate(note: notePM_Note, name: string, parentFolder?: Folder) {
    const folder = await this.find(note, name);
    if (folder) return folder;
    return this.create(note, name, parentFolder);
  }
  
  async find(note: notePM_Note, name: string): Promise<Folder | undefined> {
    const response1 = await Folder.NotePM.fetch('GET', `/notes/${note.note_code}/folders`) as {
      folders: notePM_Folder[]
    };
    const params = response1.folders.filter(folder => folder.name === name)[0];
    return params ? new Folder(params) : undefined;
  }

  async create(note: notePM_Note, name: string, parentFolder?: Folder): Promise<Folder> {
    const response = await Folder.NotePM.fetch('POST', `/notes/${note.note_code}/folders`, {
      name,
      parent_folder_id: parentFolder ? parentFolder.folder_id : null
    });
    return new Folder(response);
  }
}

export default Folder;
