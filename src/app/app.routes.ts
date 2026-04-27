import { Routes } from '@angular/router';
import { superAdminGuard } from './core/auth/superadmin.guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: '/login',
        pathMatch: 'full'
    },
    {
        path: 'login',
        loadComponent: () => import('./components/pages/login/login').then(l => l.Login)
    },
    {
        path: 'agenda',
        loadComponent: () => import('./components/pages/agenda/agenda').then(a => a.Agenda)
    },
    {
        path: 'groups',
        loadComponent: () => import('./components/pages/groups/groups').then(g => g.Groups),
        canActivate: [superAdminGuard]
    },
    {
        path: 'help',
        loadComponent: () => import('./components/pages/help/help').then(h => h.Help)
    },
    {
        path: 'live-streamers',
        loadComponent: () => import('./components/pages/live-streamers/live-streamers').then(ls => ls.LiveStreamers)
    },
    {
        path: 'stream/:channelId',
        loadComponent: () => import('./components/pages/stream/stream').then(s => s.Stream)
    },
    {
        path: 'profile',
        loadComponent: () => import('./components/pages/profile/profile').then(p => p.Profile)
    },
    {
        path: 'global-ranking',
        loadComponent: () => import('./components/pages/rankings/global-ranking/global-ranking').then(glr => glr.GlobalRanking)
    },
    {
        path: 'group-ranking',
        loadComponent: () => import('./components/pages/rankings/group-ranking/group-ranking').then(grr => grr.GroupRanking)
    },
    {
        path: 'users',
        loadComponent: () => import('./components/pages/users/users').then(u => u.Users),
        canActivate: [superAdminGuard]
    }
];
