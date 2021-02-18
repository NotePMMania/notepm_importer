class Tag {
  public name: string = '';

  constructor(params: TagJson) {
    this.name = params.name;
  }
}

export default Tag;
