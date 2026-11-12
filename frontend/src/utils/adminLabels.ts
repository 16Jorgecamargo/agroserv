import type { BadgeTone } from '../components/ui/Badge'
import type { AdminActionType, Role, UserStatus, VerificationStatus } from '../types/entities'

export const roleLabels: Record<Role, string> = {
  producer: 'Produtor',
  provider: 'Prestador',
  admin: 'Administrador',
}

export const userStatusLabels: Record<UserStatus, string> = {
  active: 'Ativa',
  suspended: 'Suspensa',
  deleted: 'Excluída',
}

export const userStatusTones: Record<UserStatus, BadgeTone> = {
  active: 'success',
  suspended: 'danger',
  deleted: 'neutral',
}

export const verificationStatusLabels: Record<VerificationStatus, string> = {
  not_sent: 'Não enviada',
  under_review: 'Em análise',
  approved: 'Aprovada',
  rejected: 'Rejeitada',
}

export const adminActionLabels: Record<AdminActionType, string> = {
  suspend_user: 'Suspendeu conta',
  reactivate_user: 'Reativou conta',
  create_admin: 'Criou administrador',
  approve_verification: 'Aprovou verificação',
  reject_verification: 'Rejeitou verificação',
  hide_service: 'Ocultou anúncio',
  show_service: 'Mostrou anúncio',
  delete_service: 'Removeu anúncio',
  hide_review: 'Ocultou avaliação',
  warn_user: 'Advertiu usuário',
  resolve_report: 'Resolveu denúncia',
  dismiss_report: 'Arquivou denúncia',
  create_category: 'Criou categoria',
  update_category: 'Editou categoria',
  delete_category: 'Apagou categoria',
}
