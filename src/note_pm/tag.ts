import NotePM from './index';

class Tag {
  static NotePM: NotePM;
  public name = '';
  public page_count = 0;

  constructor(params: notePM_Tag) {
    this.setParams(params);
  }

  setParams(params: notePM_Tag) {
    this.name = params.name;
    if (params.page_count) {
      this.page_count = params.page_count;
    }
  }

  async add(name: string) {

  }

  async save(): Promise<Tag> {
    const response = await Tag.NotePM.fetch('POST', `/tags`, {
      name: this.name,
    });
    const params = response.tag as notePM_Tag;
    this.setParams(params);
    return this;
  }

  static async fetchAll(page = 1): Promise<Tag[]> {
    const perPage = 100;
    const res = await Tag.NotePM.fetch('GET', `/tags?page=${page}&per_page=${perPage}`);
    let tags = (res.tags as notePM_Tag[]).map(t => new Tag(t));
    if (tags.length > perPage) {
      const nextTags = await Tag.fetchAll(page + 1);
      tags = tags.concat(nextTags);
    } else {
      return tags.map(t => new Tag(t));
    }
    return tags;
  }
}

export default Tag;
