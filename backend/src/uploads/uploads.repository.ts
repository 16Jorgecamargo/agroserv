import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Upload } from './entities/upload.entity.js';

@Injectable()
export class UploadsRepository {
  constructor(@InjectRepository(Upload) private readonly uploads: Repository<Upload>) {}

  findById(id: string): Promise<Upload | null> {
    // Busca um arquivo enviado pelo id
    return this.uploads.findOneBy({ id });
  }

  findByIds(ids: string[]): Promise<Upload[]> {
    // Busca vários arquivos pelo id
    return ids.length ? this.uploads.findBy({ id: In(ids) }) : Promise.resolve([]);
  }

  findByUrls(urls: string[]): Promise<Upload[]> {
    // Busca os arquivos a partir das URLs usadas em outros campos
    return urls.length ? this.uploads.findBy({ url: In(urls) }) : Promise.resolve([]);
  }

  create(data: Partial<Upload>): Promise<Upload> {
    // Registra um arquivo novo
    return this.uploads.save(this.uploads.create(data));
  }
}
