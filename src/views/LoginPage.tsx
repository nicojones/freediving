'use client';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { requestMagicLink } from '../services/authService';
import { FishIcon } from '../components/ui/FishIcon';
import { TextInput } from '../components/ui/TextInput';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { VersionFooter } from '../components/shared/VersionFooter';
import { APP_NAME, APP_DESCR } from '../constants/app';

interface LoginPageProps {
  /** Kept for AppShell compatibility; magic link flow redirects, so never called. */
  onLoginSuccess?: () => void;
}

const ERROR_MESSAGES: Record<string, string> = {
  expired: 'Link expired or already used.',
  missing: 'Invalid link.',
};

export const LoginPage = (_props: LoginPageProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const err = searchParams.get('error');
    if (err && ERROR_MESSAGES[err]) {
      setError(ERROR_MESSAGES[err]);
      router.replace('/login', { scroll: false });
    }
  }, [searchParams, router]);

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await requestMagicLink(email);
    setLoading(false);
    if ('message' in result) {
      setEmailSent(true);
    } else if ('error' in result) {
      setError(result.error);
    }
  };

  const handleTryAgain = () => {
    setEmailSent(false);
    setError(null);
  };

  return (
    <>
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 abyssal-gradient" />
        <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] opacity-20 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-background to-transparent" />
      </div>
      <main className="relative z-10 w-full min-h-screen flex flex-col items-center justify-center px-10 selection:bg-primary selection:text-on-primary">
        <div className="w-full max-w-md flex flex-col items-center">
          <header className="mb-20 text-center flex flex-col items-center">
            <div className="mb-6 flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary border border-primary/20">
              <FishIcon className="text-primary" size={40} aria-hidden />
            </div>
            <h1 className="font-headline text-[3.5rem] font-bold tracking-tight text-primary leading-none mb-2">
              {APP_NAME}
            </h1>
            <p className="font-label text-on-surface-variant tracking-[0.2em] uppercase text-[0.65rem] font-medium">
              {APP_DESCR}
            </p>
          </header>

          {emailSent ? (
            <div className="w-full space-y-6">
              <p data-testid="login-success" className="text-primary text-xl font-body text-center">
                Check the inbox for {email}
              </p>
              <p className="text-on-surface-variant text-sm font-body text-center">
                If you didn&apos;t receive any email, wait some seconds and{' '}
                <button
                  type="button"
                  onClick={handleTryAgain}
                  data-testid="login-try-again"
                  className="text-primary underline hover:no-underline"
                >
                  try again
                </button>
                .
              </p>
              {error && (
                <p data-testid="login-error" className="text-error text-sm font-body text-center">
                  {error}
                </p>
              )}
            </div>
          ) : (
            <form onSubmit={handleMagicLinkSubmit} className="w-full space-y-8">
              <div className="space-y-6">
                <TextInput
                  id="email"
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="you@example.com"
                  autoComplete="email"
                  icon="mail"
                  data-testid="login-email"
                />
              </div>
              {error && (
                <p data-testid="login-error" className="text-error text-sm font-body">
                  {error}
                </p>
              )}
              <PrimaryButton
                data-testid="login-send-link"
                type="submit"
                disabled={loading}
                loading={loading}
                size="login"
                icon="mail"
              >
                Send me a link
              </PrimaryButton>
            </form>
          )}

          <footer className="mt-24 text-center">
            <VersionFooter />
          </footer>
        </div>

        <div className="fixed top-20 right-20 w-32 h-32 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="fixed bottom-40 left-10 w-48 h-48 rounded-full bg-secondary/5 blur-3xl pointer-events-none" />
      </main>
    </>
  );
};
