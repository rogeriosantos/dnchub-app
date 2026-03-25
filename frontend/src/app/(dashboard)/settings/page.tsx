'use client';

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building, User, Bell, Shield, Palette, Globe, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { usersService, type UserUpdateRequest, type UserPasswordUpdateRequest } from '@/lib/api';
import { changeLanguage, supportedLanguages } from '@/lib/i18n';
import type { User as UserType } from '@/types';

export default function SettingsPage() {
  const { t } = useTranslation();
  const { setTheme } = useTheme();
  const [user, setUser] = React.useState<UserType | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);

  // Profile form state
  const [profileForm, setProfileForm] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  // Appearance form state
  const [appearanceForm, setAppearanceForm] = React.useState({
    themePreference: 'system' as 'light' | 'dark' | 'system',
    language: 'en',
    dateFormat: 'MM/DD/YYYY' as 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD',
  });
  const [isSavingAppearance, setIsSavingAppearance] = React.useState(false);

  // Password form state
  const [passwordForm, setPasswordForm] = React.useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Load user on mount
  React.useEffect(() => {
    async function loadUser() {
      try {
        setIsLoading(true);
        const userData = await usersService.getMe();
        setUser(userData);
        setProfileForm({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          phone: userData.phone || '',
        });
        const themePreference = userData.themePreference || 'system';
        setAppearanceForm({
          themePreference,
          language: userData.language || 'en',
          dateFormat: userData.dateFormat || 'MM/DD/YYYY',
        });
        // Apply the saved theme preference
        setTheme(themePreference);
      } catch (err) {
        console.error('Failed to load user:', err);
        toast.error('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, [setTheme]);

  // Handle profile save
  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      const updateData: UserUpdateRequest = {
        first_name: profileForm.firstName,
        last_name: profileForm.lastName,
        email: profileForm.email,
        phone: profileForm.phone || undefined,
      };
      const updatedUser = await usersService.updateMe(updateData);
      setUser(updatedUser);
      toast.success('Profile updated', {
        description: 'Your profile has been saved successfully.',
      });
    } catch (err) {
      console.error('Failed to save profile:', err);
      toast.error('Failed to save profile', {
        description: 'Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle password change
  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match', {
        description: 'Please make sure your new passwords match.',
      });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error('Password too short', {
        description: 'Password must be at least 8 characters.',
      });
      return;
    }

    try {
      setIsChangingPassword(true);
      const updateData: UserPasswordUpdateRequest = {
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword,
      };
      await usersService.updatePassword(updateData);
      toast.success('Password updated', {
        description: 'Your password has been changed successfully.',
      });
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      console.error('Failed to change password:', err);
      toast.error('Failed to change password', {
        description: 'Please check your current password and try again.',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Handle appearance save
  const handleSaveAppearance = async () => {
    try {
      setIsSavingAppearance(true);
      const updateData: UserUpdateRequest = {
        theme_preference: appearanceForm.themePreference,
        language: appearanceForm.language,
        date_format: appearanceForm.dateFormat,
      };
      const updatedUser = await usersService.updateMe(updateData);
      setUser(updatedUser);
      toast.success('Appearance updated', {
        description: 'Your appearance settings have been saved successfully.',
      });
    } catch (err) {
      console.error('Failed to save appearance:', err);
      toast.error('Failed to save appearance', {
        description: 'Please try again.',
      });
    } finally {
      setIsSavingAppearance(false);
    }
  };

  return (
    <div className='space-y-6'>
      {/* Page Header */}
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>{t('settings.title')}</h1>
        <p className='text-muted-foreground'>{t('settings.subtitle')}</p>
      </div>

      <Tabs defaultValue='profile' className='space-y-6'>
        <TabsList className='inline-flex h-auto w-auto flex-wrap gap-1 bg-transparent p-0'>
          <TabsTrigger value='profile' className='gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm'>
            <User className='h-4 w-4' />
            {t('settings.profile.title')}
          </TabsTrigger>
          <TabsTrigger value='organization' className='gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm'>
            <Building className='h-4 w-4' />
            {t('settings.organization.title')}
          </TabsTrigger>
          <TabsTrigger value='notifications' className='gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm'>
            <Bell className='h-4 w-4' />
            {t('settings.notifications.title')}
          </TabsTrigger>
          <TabsTrigger value='appearance' className='gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm'>
            <Palette className='h-4 w-4' />
            {t('settings.appearance.title')}
          </TabsTrigger>
          <TabsTrigger value='security' className='gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm'>
            <Shield className='h-4 w-4' />
            {t('settings.security.title')}
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value='profile' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.profile.title')}</CardTitle>
              <CardDescription>{t('settings.profile.description')}</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {isLoading ? (
                <div className='space-y-4'>
                  <div className='flex items-center gap-4'>
                    <Skeleton className='h-20 w-20 rounded-full' />
                    <div className='space-y-2'>
                      <Skeleton className='h-9 w-28' />
                      <Skeleton className='h-4 w-40' />
                    </div>
                  </div>
                  <Separator />
                  <div className='grid gap-4 sm:grid-cols-2'>
                    <Skeleton className='h-10 w-full' />
                    <Skeleton className='h-10 w-full' />
                  </div>
                  <div className='grid gap-4 sm:grid-cols-2'>
                    <Skeleton className='h-10 w-full' />
                    <Skeleton className='h-10 w-full' />
                  </div>
                </div>
              ) : (
                <>
                  <div className='flex items-center gap-4'>
                    <div className='flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-semibold'>
                      {profileForm.firstName?.[0] || ''}
                      {profileForm.lastName?.[0] || ''}
                    </div>
                    <div>
                      <Button variant='outline' size='sm' disabled>
                        Change Photo
                      </Button>
                      <p className='mt-1 text-xs text-muted-foreground'>JPG, PNG or GIF. Max size 2MB.</p>
                    </div>
                  </div>

                  <Separator />

                  <div className='grid gap-4 sm:grid-cols-2'>
                    <div className='space-y-2'>
                      <Label htmlFor='firstName'>{t('settings.profile.firstName')}</Label>
                      <Input
                        id='firstName'
                        value={profileForm.firstName}
                        onChange={(e) => setProfileForm((prev) => ({ ...prev, firstName: e.target.value }))}
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='lastName'>{t('settings.profile.lastName')}</Label>
                      <Input
                        id='lastName'
                        value={profileForm.lastName}
                        onChange={(e) => setProfileForm((prev) => ({ ...prev, lastName: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className='grid gap-4 sm:grid-cols-2'>
                    <div className='space-y-2'>
                      <Label htmlFor='email'>{t('settings.profile.email')}</Label>
                      <Input
                        id='email'
                        type='email'
                        value={profileForm.email}
                        onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='phone'>{t('settings.profile.phone')}</Label>
                      <Input
                        id='phone'
                        type='tel'
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className='flex justify-end'>
                    <Button onClick={handleSaveProfile} disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                          {t('settings.profile.saving')}
                        </>
                      ) : (
                        <>
                          <Save className='mr-2 h-4 w-4' />
                          {t('settings.profile.saveChanges')}
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organization Tab */}
        <TabsContent value='organization' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>Manage your organization settings</CardDescription>
            </CardHeader>
            <CardContent className='flex flex-col items-center justify-center py-8'>
              <Building className='h-12 w-12 text-muted-foreground mb-4' />
              <p className='text-muted-foreground text-center mb-4'>
                Organization settings have been moved to a dedicated page for better management.
              </p>
              <Button asChild>
                <a href='/settings/organization'>Go to Organization Settings</a>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value='notifications' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>Manage when you receive email notifications</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label>Maintenance Reminders</Label>
                  <p className='text-sm text-muted-foreground'>Receive notifications about upcoming maintenance</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label>License Expiry Alerts</Label>
                  <p className='text-sm text-muted-foreground'>Get notified when driver licenses are about to expire</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label>Insurance Expiry Alerts</Label>
                  <p className='text-sm text-muted-foreground'>Get notified when vehicle insurance is about to expire</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label>Fuel Cost Alerts</Label>
                  <p className='text-sm text-muted-foreground'>Notifications when fuel costs exceed thresholds</p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label>Weekly Summary Reports</Label>
                  <p className='text-sm text-muted-foreground'>Receive weekly fleet performance summaries</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Push Notifications</CardTitle>
              <CardDescription>Manage in-app notification preferences</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label>Real-time Alerts</Label>
                  <p className='text-sm text-muted-foreground'>Show notifications in the app header</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label>Sound Notifications</Label>
                  <p className='text-sm text-muted-foreground'>Play a sound for important alerts</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value='appearance' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.appearance.theme')}</CardTitle>
              <CardDescription>{t('settings.appearance.description')}</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {isLoading ? (
                <div className='space-y-4'>
                  <Skeleton className='h-4 w-24' />
                  <div className='grid grid-cols-3 gap-4'>
                    <Skeleton className='h-24 w-full' />
                    <Skeleton className='h-24 w-full' />
                    <Skeleton className='h-24 w-full' />
                  </div>
                  <Skeleton className='h-10 w-full' />
                  <Skeleton className='h-10 w-full' />
                </div>
              ) : (
                <>
                  <div className='space-y-2'>
                    <Label>{t('settings.appearance.theme')}</Label>
                    <div className='grid grid-cols-3 gap-4'>
                      <button
                        type='button'
                        onClick={() => {
                          setAppearanceForm((prev) => ({ ...prev, themePreference: 'light' }));
                          setTheme('light');
                        }}
                        className={`cursor-pointer rounded-lg border-2 p-4 text-center transition-colors ${
                          appearanceForm.themePreference === 'light' ? 'border-primary' : 'border-muted hover:border-primary'
                        }`}
                      >
                        <div className='mx-auto mb-2 h-8 w-8 rounded-full bg-white border' />
                        <span className='text-sm font-medium'>{t('settings.appearance.themeLight')}</span>
                      </button>
                      <button
                        type='button'
                        onClick={() => {
                          setAppearanceForm((prev) => ({ ...prev, themePreference: 'dark' }));
                          setTheme('dark');
                        }}
                        className={`cursor-pointer rounded-lg border-2 p-4 text-center transition-colors ${
                          appearanceForm.themePreference === 'dark' ? 'border-primary' : 'border-muted hover:border-primary'
                        }`}
                      >
                        <div className='mx-auto mb-2 h-8 w-8 rounded-full bg-slate-900' />
                        <span className='text-sm font-medium'>{t('settings.appearance.themeDark')}</span>
                      </button>
                      <button
                        type='button'
                        onClick={() => {
                          setAppearanceForm((prev) => ({ ...prev, themePreference: 'system' }));
                          setTheme('system');
                        }}
                        className={`cursor-pointer rounded-lg border-2 p-4 text-center transition-colors ${
                          appearanceForm.themePreference === 'system' ? 'border-primary' : 'border-muted hover:border-primary'
                        }`}
                      >
                        <div className='mx-auto mb-2 h-8 w-8 rounded-full bg-gradient-to-r from-white to-slate-900' />
                        <span className='text-sm font-medium'>{t('settings.appearance.themeSystem')}</span>
                      </button>
                    </div>
                  </div>

                  <Separator />

                  <div className='space-y-2'>
                    <Label htmlFor='language'>{t('settings.appearance.language')}</Label>
                    <Select
                      value={appearanceForm.language}
                      onValueChange={(value) => {
                        setAppearanceForm((prev) => ({ ...prev, language: value }));
                        changeLanguage(value);
                      }}
                    >
                      <SelectTrigger id='language'>
                        <SelectValue placeholder={t('settings.appearance.language')} />
                      </SelectTrigger>
                      <SelectContent>
                        {supportedLanguages.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            {lang.nativeName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='dateFormat'>{t('settings.appearance.dateFormat')}</Label>
                    <Select
                      value={appearanceForm.dateFormat}
                      onValueChange={(value) =>
                        setAppearanceForm((prev) => ({
                          ...prev,
                          dateFormat: value as 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD',
                        }))
                      }
                    >
                      <SelectTrigger id='dateFormat'>
                        <SelectValue placeholder={t('settings.appearance.dateFormat')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='MM/DD/YYYY'>MM/DD/YYYY</SelectItem>
                        <SelectItem value='DD/MM/YYYY'>DD/MM/YYYY</SelectItem>
                        <SelectItem value='YYYY-MM-DD'>YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='flex justify-end'>
                    <Button onClick={handleSaveAppearance} disabled={isSavingAppearance}>
                      {isSavingAppearance ? (
                        <>
                          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className='mr-2 h-4 w-4' />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value='security' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='currentPassword'>Current Password</Label>
                <Input
                  id='currentPassword'
                  type='password'
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='newPassword'>New Password</Label>
                <Input
                  id='newPassword'
                  type='password'
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='confirmPassword'>Confirm New Password</Label>
                <Input
                  id='confirmPassword'
                  type='password'
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                />
              </div>
              <div className='flex justify-end'>
                <Button onClick={handleChangePassword} disabled={isChangingPassword}>
                  {isChangingPassword ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className='mr-2 h-4 w-4' />
                      Update Password
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label>Enable 2FA</Label>
                  <p className='text-sm text-muted-foreground'>Require a code from your authenticator app when signing in</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>Manage your active login sessions</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='rounded-lg border p-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='rounded-full bg-green-100 p-2'>
                      <Globe className='h-4 w-4 text-green-600' />
                    </div>
                    <div>
                      <p className='font-medium'>Current Session</p>
                      <p className='text-sm text-muted-foreground'>Windows • Chrome • New York, USA</p>
                    </div>
                  </div>
                  <Badge variant='secondary'>Active</Badge>
                </div>
              </div>
              <Button variant='outline' className='w-full'>
                Sign Out All Other Sessions
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
