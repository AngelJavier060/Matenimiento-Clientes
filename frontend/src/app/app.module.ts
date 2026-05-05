import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';

// Shared Components
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { CardComponent } from './shared/components/card/card.component';
import { MainLayoutComponent } from './shared/layouts/main-layout/main-layout.component';

import { HomeLandingComponent } from './pages/home/home-landing.component';

// Pages
import { LoginComponent } from './pages/auth/login/login.component';
import { RegisterComponent } from './pages/auth/register/register.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { VehicleListComponent } from './pages/vehicles/vehicle-list/vehicle-list.component';
import { VehicleDetailComponent } from './pages/vehicles/vehicle-detail/vehicle-detail.component';
import { VehicleFormComponent } from './pages/vehicles/vehicle-form/vehicle-form.component';
import { MaintenanceListComponent } from './pages/maintenance/maintenance-list/maintenance-list.component';
import { MaintenanceFormComponent } from './pages/maintenance/maintenance-form/maintenance-form.component';
import { HistoricPageComponent } from './pages/historic/historic-page.component';
import { MaintenanceHistoryReportComponent } from './pages/historic/maintenance-history-report/maintenance-history-report.component';
import { ReminderListComponent } from './pages/reminders/reminder-list/reminder-list.component';
import { ReminderNewRedirectComponent } from './pages/reminders/reminder-new-redirect.component';
import { UserAdminListComponent } from './pages/users/user-admin-list.component';
import { UserAdminFormComponent } from './pages/users/user-admin-form.component';

import { MpPlanComponent } from './components/mp-plan/mp-plan.component';

@NgModule({
  declarations: [
    AppComponent,
    SidebarComponent,
    NavbarComponent,
    CardComponent,
    MainLayoutComponent,
    HomeLandingComponent,
    LoginComponent,
    RegisterComponent,
    DashboardComponent,
    VehicleListComponent,
    VehicleDetailComponent,
    VehicleFormComponent,
    MaintenanceListComponent,
    MaintenanceFormComponent,
    HistoricPageComponent,
    MaintenanceHistoryReportComponent,
    ReminderListComponent,
    ReminderNewRedirectComponent,
    UserAdminListComponent,
    UserAdminFormComponent,
    MpPlanComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    AppRoutingModule,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
