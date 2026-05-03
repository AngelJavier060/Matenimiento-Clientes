import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';

// Shared Components
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { CardComponent } from './shared/components/card/card.component';
import { MainLayoutComponent } from './shared/layouts/main-layout/main-layout.component';

// Pages
import { LoginComponent } from './pages/auth/login/login.component';
import { RegisterComponent } from './pages/auth/register/register.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { VehicleListComponent } from './pages/vehicles/vehicle-list/vehicle-list.component';
import { VehicleDetailComponent } from './pages/vehicles/vehicle-detail/vehicle-detail.component';
import { VehicleFormComponent } from './pages/vehicles/vehicle-form/vehicle-form.component';
import { MaintenanceListComponent } from './pages/maintenance/maintenance-list/maintenance-list.component';
import { MaintenanceFormComponent } from './pages/maintenance/maintenance-form/maintenance-form.component';
import { ReminderListComponent } from './pages/reminders/reminder-list/reminder-list.component';
import { ReminderFormComponent } from './pages/reminders/reminder-form/reminder-form.component';

@NgModule({
  declarations: [
    AppComponent,
    SidebarComponent,
    NavbarComponent,
    CardComponent,
    MainLayoutComponent,
    LoginComponent,
    RegisterComponent,
    DashboardComponent,
    VehicleListComponent,
    VehicleDetailComponent,
    VehicleFormComponent,
    MaintenanceListComponent,
    MaintenanceFormComponent,
    ReminderListComponent,
    ReminderFormComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
