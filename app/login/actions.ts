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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.user_metadata?.role === 'cliente') {
      await supabase.auth.signOut();
      return {
        ok: false,
        error: 'Esta conta é de cliente e não tem acesso ao painel do mercado.',
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
