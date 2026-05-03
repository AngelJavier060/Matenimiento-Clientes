import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'config/theme.dart';
import 'providers/auth_provider.dart';
import 'providers/maintenance_provider.dart';
import 'providers/reminder_provider.dart';
import 'providers/vehicle_provider.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/register_screen.dart';
import 'screens/home/home_screen.dart';
import 'screens/maintenance/maintenance_form_screen.dart';
import 'screens/reminders/reminder_form_screen.dart';
import 'screens/splash_screen.dart';
import 'screens/vehicles/vehicle_detail_screen.dart';
import 'screens/vehicles/vehicle_form_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => VehicleProvider()),
        ChangeNotifierProvider(create: (_) => MaintenanceProvider()),
        ChangeNotifierProvider(create: (_) => ReminderProvider()),
      ],
      child: MaterialApp(
        title: 'Mantenimiento Vehicular',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        initialRoute: '/splash',
        routes: {
          '/splash': (context) => const SplashScreen(),
          '/login': (context) => const LoginScreen(),
          '/register': (context) => const RegisterScreen(),
          '/home': (context) => const HomeScreen(),
          '/vehicles/detail': (context) => const VehicleDetailScreen(),
          '/vehicles/form': (context) => const VehicleFormScreen(),
          '/maintenance/form': (context) => const MaintenanceFormScreen(),
          '/reminders/form': (context) => const ReminderFormScreen(),
        },
      ),
    );
  }
}
