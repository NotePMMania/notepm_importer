import NotePM from './index';
import User from './user';
import Group from './group';

class Note {
  static NotePM: NotePM;

  public note_code: string | undefined = undefined;
  public name = '';
  public description = '';
  public icon_url: string | undefined = undefined
  public archived = false;
  public scope = '';
  public groups: Group[] | null = null;
  public users: (User | string)[] | null = [];

  constructor(params: notePM_Note) {
    this.setParams(params);
  }

  setParams(params: notePM_Note): Note {
    this.note_code = params.note_code;
    this.name = params.name;
    this.description = params.description;
    this.icon_url = params.icon_url;
    this.archived = params.archived || false;
    this.scope = params.scope;
    return this;
  }

  async save(): Promise<void> {
    if (this.note_code) {
      await this.update();
    } else {
      const params = await this.create(this.name, this.description, this.scope, this.users as string[]);
      this.setParams(params);
    }
  }

  async findOrCreate(name: string, description: string, scope: string): Promise<Note> {
    const params = await this.find(name);
    if (params) return new Note(params);
    return new Note(await this.create(name, description, scope, []));
  }

  async find(name: string): Promise<notePM_Note | null> {
    const response1 = await Note.NotePM.fetch('GET', '/notes') as {
      notes: notePM_Note[]
    };
    const note: notePM_Note = response1.notes.filter((note: notePM_Note) => note.name === name)[0];
    return note;
  }

  async create(name: string, description: string, scope: string, users: string[]): Promise<notePM_Note> {
    const response = await Note.NotePM.fetch('POST', '/notes', { name, description, scope, users });
    if (response.messages) {
      throw new Error(`Note creating error. ${response.messages.join(',')}`);
    }
    return response.note as notePM_Note;
  }

  async update(): Promise<Note> {
    const response = await Note.NotePM.fetch('PATCH', `/notes/${this.note_code}`, {
      name: this.name,
      description: this.description,
      scope: this.scope
    });
    return this.setParams(response as notePM_Note);
  }

  static async fetchAll(page = 1): Promise<Note[]> {
    const perPage = 100;
    const res = await Note.NotePM.fetch('GET', `/notes?page=${page}&per_page=${perPage}`);
    let notes = (res.notes as notePM_Page[]).map(t => new Note(t));
    if (notes.length > perPage) {
      const nextNotes = await Note.fetchAll(page + 1);
      notes = notes.concat(nextNotes);
    } else {
      return notes.map(t => new Note(t));
    }
    return notes;
  }

  async delete(): Promise<void> {
    const response = await Note.NotePM.fetch('DELETE', `/notes/${this.note_code}`);
  }
}

export default Note;
