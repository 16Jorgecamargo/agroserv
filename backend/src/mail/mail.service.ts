import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

function escapeHtml(value: string): string {
  // Evita que nomes com símbolos quebrem o HTML do e-mail
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger('Mail');
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    // Sem servidor SMTP configurado, a API avisa e não envia e-mails
    const host = this.config.get<string>('smtpHost');
    if (!host) {
      this.logger.warn('SMTP não configurado: defina SMTP_HOST para enviar e-mails.');
      return;
    }

    // Conexão SMTP reaproveitada por todos os envios
    const port = this.config.getOrThrow<number>('smtpPort');
    const user = this.config.get<string>('smtpUser');
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: this.config.getOrThrow<boolean>('smtpSecure'),
      auth: user ? { user, pass: this.config.get<string>('smtpPass') } : undefined,
    });
  }

  async send(message: MailMessage): Promise<boolean> {
    // Falha de envio fica no log e nunca derruba a requisição
    if (!this.transporter) {
      this.logger.warn(`E-mail "${message.subject}" não enviado: SMTP não configurado.`);
      return false;
    }
    try {
      await this.transporter.sendMail({ from: this.config.getOrThrow<string>('mailFrom'), ...message });
      this.logger.log(`E-mail "${message.subject}" enviado.`);
      return true;
    } catch (error) {
      this.logger.error(`Falha ao enviar "${message.subject}": ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  sendPasswordReset(to: string, name: string, link: string): Promise<boolean> {
    // E-mail com o link de redefinição, em texto e em HTML
    const safeName = escapeHtml(name);
    const text = [
      `Olá, ${name}.`,
      '',
      'Recebemos um pedido para redefinir a senha da sua conta no AgroServ.',
      `Abra o link para criar uma nova senha: ${link}`,
      '',
      'O link vale por 60 minutos e só pode ser usado uma vez.',
      'Se você não fez este pedido, ignore este e-mail. Sua senha continua a mesma.',
    ].join('\n');
    const html = `
      <div style="font-family: Arial, sans-serif; color: #17201A; max-width: 520px;">
        <h2 style="color: #2F6B45;">Redefinição de senha</h2>
        <p>Olá, ${safeName}.</p>
        <p>Recebemos um pedido para redefinir a senha da sua conta no AgroServ.</p>
        <p>
          <a href="${link}" style="display: inline-block; background: #2F6B45; color: #FFFFFF; padding: 12px 20px; border-radius: 10px; text-decoration: none;">Criar nova senha</a>
        </p>
        <p>Se o botão não abrir, copie este endereço no navegador:<br><a href="${link}">${link}</a></p>
        <p style="color: #667085;">O link vale por 60 minutos e só pode ser usado uma vez. Se você não fez este pedido, ignore este e-mail. Sua senha continua a mesma.</p>
      </div>`;
    return this.send({ to, subject: 'AgroServ: redefinição de senha', text, html });
  }
}
