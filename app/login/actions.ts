'use server';

import { createClient } from '@/app/lib/supabase/server';

type LoginResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      error: string;
    };

export async function loginWithPassword({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<LoginResult> {
  const supabase = await createClient();

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        ok: false,
        error: error.message,
      };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : 'Nao foi possivel entrar agora. Tente novamente.',
    };
  }
}
