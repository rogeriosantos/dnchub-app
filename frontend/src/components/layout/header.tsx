'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, User, Settings, LogOut, AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import type { User as UserType, Notification } from '@/types';
import { getInitials, formatDate } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';
import { GlobalSearch } from '@/components/layout/global-search';

interface HeaderProps {
  user: UserType;
  notifications: Notification[];
  onLogout?: () => void;
  onMarkAsRead?: (notificationId: string) => void;
  onMarkAllAsRead?: () => void;
}

const notificationIcons = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
  success: CheckCircle,
};

const notificationColors = {
  info: 'text-info',
  warning: 'text-warning',
  error: 'text-destructive',
  success: 'text-success',
};

export function Header({ user, notifications, onLogout, onMarkAsRead, onMarkAllAsRead }: HeaderProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = React.useState(false);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className='sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border bg-background/95 backdrop-blur-md px-6'>
      {/* Global Search */}
      <GlobalSearch />

      {/* Right Section - pushed to far right */}
      <div className='ml-auto flex items-center gap-1'>
        {/* Theme Toggle */}
        <ThemeToggle />

        {!mounted ? null : (<>

        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant='ghost' size='icon' className='relative h-9 w-9 hover:bg-secondary transition-colors duration-150'>
              <Bell className='h-4 w-4' />
              {unreadCount > 0 && (
                <span className='absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground'>
                  {unreadCount}
                </span>
              )}
              <span className='sr-only'>{t('header.notifications')}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align='end' className='w-80 p-0'>
            <div className='flex items-center justify-between border-b px-4 py-3'>
              <h4 className='font-semibold'>{t('header.notifications')}</h4>
              {unreadCount > 0 && (
                <Button variant='ghost' size='sm' className='text-xs' onClick={onMarkAllAsRead}>
                  {t('header.markAllAsRead')}
                </Button>
              )}
            </div>
            <ScrollArea className='h-80'>
              {notifications.length === 0 ? (
                <div className='flex flex-col items-center justify-center py-8 text-muted-foreground'>
                  <Bell className='h-10 w-10 mb-2' />
                  <p>{t('header.noNotifications')}</p>
                </div>
              ) : (
                <div className='divide-y'>
                  {notifications.map((notification) => {
                    const Icon = notificationIcons[notification.type];
                    return (
                      <Link
                        key={notification.id}
                        href={notification.link || '#'}
                        className={cn('flex gap-3 px-4 py-3 hover:bg-accent transition-colors', !notification.isRead && 'bg-accent/50')}
                        onClick={() => !notification.isRead && onMarkAsRead?.(notification.id)}
                      >
                        <Icon className={cn('h-5 w-5 mt-0.5 shrink-0', notificationColors[notification.type])} />
                        <div className='flex-1 space-y-1'>
                          <p className='text-sm font-medium leading-none'>{notification.title}</p>
                          <p className='text-sm text-muted-foreground line-clamp-2'>{notification.message}</p>
                          <p className='text-xs text-muted-foreground'>
                            {formatDate(notification.createdAt, {
                              hour: 'numeric',
                              minute: 'numeric',
                            })}
                          </p>
                        </div>
                        {!notification.isRead && <div className='h-2 w-2 rounded-full bg-primary mt-2' />}
                      </Link>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
            <div className='border-t p-2'>
              <Button variant='ghost' className='w-full justify-center' asChild>
                <Link href='/notifications'>View all notifications</Link>
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              className='relative h-9 w-9 rounded-full p-0 hover:ring-2 hover:ring-primary/20 transition-all duration-150'
            >
              <Avatar className='h-8 w-8'>
                <AvatarImage src={user.avatar} alt={`${user.firstName} ${user.lastName}`} />
                <AvatarFallback className='bg-primary/10 text-primary text-xs font-medium'>
                  {getInitials(`${user.firstName} ${user.lastName}`)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-56'>
            <DropdownMenuLabel className='font-normal'>
              <div className='flex flex-col space-y-1'>
                <p className='text-sm font-medium leading-none'>
                  {user.firstName} {user.lastName}
                </p>
                <p className='text-xs text-muted-foreground'>{user.email}</p>
                <Badge variant='secondary' className='mt-1.5 w-fit text-[10px] uppercase tracking-wide font-medium'>
                  {user.role.replace('_', ' ')}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className='cursor-pointer'>
              <Link href='/settings/profile' className='flex items-center'>
                <User className='mr-2 h-4 w-4' />
                {t('header.viewProfile')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className='cursor-pointer'>
              <Link href='/settings' className='flex items-center'>
                <Settings className='mr-2 h-4 w-4' />
                {t('header.settings')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className='cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10' onClick={onLogout}>
              <LogOut className='mr-2 h-4 w-4' />
              {t('header.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </>)}
      </div>
    </header>
  );
}
