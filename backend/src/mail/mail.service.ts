import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailService {
  private readonly logger = new Logger('Mail');

  sendPasswordReset(email: string, link: string): void {
    // Sem servidor de e-mail nesta etapa: o link fica registrado no log
    this.logger.log(`Redefinição de senha para ${email}: ${link}`);
  }
}
