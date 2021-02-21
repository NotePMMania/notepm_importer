import NotePM from './index';
import Page from './page';
import fs from 'fs';
import { promisify } from 'util';
import FormData from 'form-data';

class Attachment {
  static NotePM: NotePM;

  public file_id: string | null = null;
  public note_code: string | null = null;
  public page_code: string | null = null;
  public file_name: string | null = null;
  public file_size: number | null = null;
  public download_url: string | null = null;
  public created_at: string | null = null;

  constructor(params: notePM_Attachment) {
    this.setParams(params);
  }

  setParams(params: notePM_Attachment) {
    this.file_id = params.file_id;
    this.note_code = params.note_code;
    this.page_code = params.page_code;
    this.file_name = params.file_name;
    this.file_size = params.file_size;
    this.download_url = params.download_url;
    this.created_at = params.created_at;
  }

  static async add(page: Page, fileName: string, filePath: string): Promise<Attachment> {
    const stat = await promisify(fs.stat)(filePath);
    const readStream = fs.createReadStream(filePath);
    const formData = new FormData;
    formData.append('file[name]', fileName);
    formData.append('file[contents]', readStream);
    formData.append('page_code', page.page_code!);
    const response = await Attachment.NotePM.fetch('POST', `/attachments`, formData);
    const params = response.attachments as notePM_Attachment;
    return new Attachment(params);
  }
}

export default Attachment;
