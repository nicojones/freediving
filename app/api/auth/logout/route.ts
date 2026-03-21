import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export const POST = async () => {
  const cookieStore = await cookies();
  cookieStore.delete('token');
  return new Response(null, { status: 204 });
};
