import { HttpContextToken } from '@angular/common/http';

/** Um 401 nesta chamada não significa "sessão expirada" (ex.: checar se já existe sessão). */
export const SEM_EXPIRACAO = new HttpContextToken<boolean>(() => false);
