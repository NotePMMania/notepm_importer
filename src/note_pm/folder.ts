import NotePM, {Note} from './index';

class Folder {
  static NotePM: NotePM;

  public folder_id: number = 0;
  public name: string = '';
  public parent_folder_id: number | null = null;

  constructor(params: notePM_Folder) {
    this.setParams(params);
  }

  setParams(params: notePM_Folder) {
    this.folder_id = params.folder_id;
    this.name = params.name.normalize('NFC');
    this.parent_folder_id = params.parent_folder_id;
  }

  async save(note: Note): Promise<void> {
    const params = await this.create(note);
    this.setParams(params);
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

  async create(note: Note): Promise<notePM_Folder> {
    const response = await Folder.NotePM.fetch('POST', `/notes/${note.note_code}/folders`, {
      name: this.name,
      parent_folder_id: this.parent_folder_id
    });
    return response.folder;
  }
}

export default Folder;
