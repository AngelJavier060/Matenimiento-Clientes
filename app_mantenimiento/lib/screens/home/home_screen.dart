import 'package:flutter/material.dart';
import '../vehicles/vehicle_list_screen.dart';
import '../maintenance/maintenance_list_screen.dart';
import '../reminders/reminder_list_screen.dart';
import 'dashboard_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = const [
    DashboardScreen(),
    VehicleListScreen(),
    MaintenanceListScreen(),
    ReminderListScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard_rounded),
            label: 'Dashboard',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.directions_car_rounded),
            label: 'Vehículos',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.build_rounded),
            label: 'Mantenimientos',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.notifications_rounded),
            label: 'Recordatorios',
          ),
        ],
      ),
    );
  }
}
