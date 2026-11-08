export type BaseRole = 'SOCIO' | 'DIRETOR' | 'PRESIDENTE' | 'ADM_GERAL';
export type MembershipStatus = 'PENDING_PAYMENT' | 'DISPONIVEL' | 'ATRASADO' | 'INATIVO';

export interface Hospicio {
  id: number;
  name: string;
  slug: string;
}

/** Resposta de GET /me e de POST /auth/verify-otp. */
export interface Me {
  id: string;
  name: string;
  email: string;
  baseRole: BaseRole;
  membershipStatus: MembershipStatus;
  hospicio: Hospicio | null;
  permissions: string[];
}

/** Resposta de POST /auth/login (202). */
export interface LoginResponse {
  challengeId: string;
  expiresInSeconds: number;
  resendAvailableInSeconds: number;
}

export const ROTULO_PAPEL: Readonly<Record<BaseRole, string>> = {
  SOCIO: 'Sócio',
  DIRETOR: 'Diretor',
  PRESIDENTE: 'Presidente',
  ADM_GERAL: 'Adm Geral',
};

/** Perfis que concedem permissões e gerenciam CPFs bloqueados. */
export const PAPEIS_GESTAO: readonly BaseRole[] = ['PRESIDENTE', 'ADM_GERAL'];
