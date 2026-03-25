'use client';

import * as React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Truck, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts';

export default function LoginPage() {
  const { t } = useTranslation();
  const { login, isLoading: authLoading } = useAuth();
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const loginSchema = z.object({
    email: z.string().email(t('validation.email')),
    password: z.string().min(1, t('validation.required')),
  });

  type LoginFormData = z.infer<typeof loginSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    setIsSubmitting(true);

    try {
      await login(data.email, data.password);
    } catch (err) {
      console.error('Login error:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t('auth.login.invalidCredentials'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    );
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4'>
      <div className='w-full max-w-md'>
        {/* Logo and Title */}
        <div className='text-center mb-8'>
          <div className='inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground mb-4'>
            <Truck className='h-8 w-8' />
          </div>
          <h1 className='text-2xl font-bold'>{t('app.name')}</h1>
          <p className='text-muted-foreground mt-1'>{t('app.tagline')}</p>
        </div>

        {/* Login Card */}
        <Card className='shadow-lg'>
          <CardHeader className='space-y-1'>
            <CardTitle className='text-2xl'>{t('auth.login.title')}</CardTitle>
            <CardDescription>{t('auth.login.subtitle')}</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className='space-y-4'>
              {error && (
                <Alert variant='destructive'>
                  <AlertCircle className='h-4 w-4' />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className='space-y-2'>
                <Label htmlFor='email'>{t('auth.login.email')}</Label>
                <div className='relative'>
                  <Mail className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                  <Input
                    id='email'
                    type='email'
                    placeholder={t('auth.login.emailPlaceholder')}
                    className='pl-10'
                    autoComplete='email'
                    {...register('email')}
                  />
                </div>
                {errors.email && <p className='text-sm text-destructive'>{errors.email.message}</p>}
              </div>

              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <Label htmlFor='password'>{t('auth.login.password')}</Label>
                  <Link href='/forgot-password' className='text-sm text-primary hover:underline'>
                    {t('auth.login.forgotPassword')}
                  </Link>
                </div>
                <div className='relative'>
                  <Lock className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                  <Input
                    id='password'
                    type='password'
                    placeholder={t('auth.login.passwordPlaceholder')}
                    className='pl-10'
                    autoComplete='current-password'
                    {...register('password')}
                  />
                </div>
                {errors.password && <p className='text-sm text-destructive'>{errors.password.message}</p>}
              </div>
            </CardContent>
            <CardFooter className='flex flex-col space-y-4 pt-6'>
              <Button type='submit' className='w-full' disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    {t('auth.login.signingIn')}
                  </>
                ) : (
                  t('auth.login.signIn')
                )}
              </Button>
              <p className='text-sm text-center text-muted-foreground'>
                {t('auth.login.noAccount')}{' '}
                <Link href='/register' className='text-primary hover:underline font-medium'>
                  {t('auth.register.createAccount')}
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>

        {/* Footer */}
        <p className='text-center text-sm text-muted-foreground mt-6'>
          &copy; {new Date().getFullYear()} {t('app.name')}. All rights reserved.
        </p>
      </div>
    </div>
  );
}
