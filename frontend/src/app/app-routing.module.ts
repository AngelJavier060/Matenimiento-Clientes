import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './shared/layouts/main-layout/main-layout.component';
import { LoginComponent } from './pages/auth/login/login.component';
import { RegisterComponent } from './pages/auth/register/register.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { VehicleListComponent } from './pages/vehicles/vehicle-list/vehicle-list.component';
import { VehicleDetailComponent } from './pages/vehicles/vehicle-detail/vehicle-detail.component';
import { VehicleFormComponent } from './pages/vehicles/vehicle-form/vehicle-form.component';
import { MaintenanceListComponent } from './pages/maintenance/maintenance-list/maintenance-list.component';
import { MaintenanceFormComponent } from './pages/maintenance/maintenance-form/maintenance-form.component';
import { HistoricPageComponent } from './pages/historic/historic-page.component';
import { ReminderListComponent } from './pages/reminders/reminder-list/reminder-list.component';
import { ReminderNewRedirectComponent } from './pages/reminders/reminder-new-redirect.component';
import { UserAdminListComponent } from './pages/users/user-admin-list.component';
import { UserAdminFormComponent } from './pages/users/user-admin-form.component';

import { HomeLandingComponent } from './pages/home/home-landing.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', component: HomeLandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'users/new', component: UserAdminFormComponent },
      { path: 'users/edit/:id', component: UserAdminFormComponent },
      { path: 'users', component: UserAdminListComponent },
      { path: 'vehicles', component: VehicleListComponent },
      { path: 'vehicles/new', redirectTo: '/register', pathMatch: 'full' },
      { path: 'vehicles/edit/:id', component: VehicleFormComponent },
      { path: 'vehicles/:id', component: VehicleDetailComponent },
      { path: 'historico', component: HistoricPageComponent },
      { path: 'maintenance', component: MaintenanceListComponent },
      { path: 'maintenance/new', component: MaintenanceFormComponent },
      { path: 'maintenance/edit/:id', component: MaintenanceFormComponent },
      { path: 'reminders', component: ReminderListComponent },
      { path: 'reminders/new', component: ReminderNewRedirectComponent },
    ]
  },
  { path: '**', redirectTo: '/dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
