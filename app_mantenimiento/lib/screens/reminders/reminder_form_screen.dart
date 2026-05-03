import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/colors.dart';
import '../../models/reminder/reminder_request.dart';
import '../../providers/reminder_provider.dart';
import '../../providers/vehicle_provider.dart';
import '../../widgets/custom_text_field.dart';

class ReminderFormScreen extends StatefulWidget {
  const ReminderFormScreen({super.key});

  @override
  State<ReminderFormScreen> createState() => _ReminderFormScreenState();
}

class _ReminderFormScreenState extends State<ReminderFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _mileageController = TextEditingController();
  final _intervalController = TextEditingController();

  int? _vehicleId;
  String? _reminderType;
  DateTime? _thresholdDate;
  bool _isRecurring = false;

  final _types = ['MILEAGE_BASED', 'DATE_BASED', 'BOTH'];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<VehicleProvider>().loadVehicles();
    });
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _mileageController.dispose();
    _intervalController.dispose();
    super.dispose();
  }

  Future<void> _selectDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime(2035),
    );
    if (date != null) {
      setState(() => _thresholdDate = date);
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    final provider = context.read<ReminderProvider>();
    final request = ReminderRequest(
      vehicleId: _vehicleId!,
      title: _titleController.text.trim(),
      description: _descriptionController.text.trim().isEmpty
          ? null
          : _descriptionController.text.trim(),
      reminderType: _reminderType,
      thresholdMileage: _mileageController.text.trim().isEmpty
          ? null
          : int.parse(_mileageController.text.trim()),
      thresholdDate: _thresholdDate?.toIso8601String().split('T')[0],
      isRecurring: _isRecurring,
      recurringInterval: _intervalController.text.trim().isEmpty
          ? null
          : int.parse(_intervalController.text.trim()),
    );

    final success = await provider.createReminder(request);
    if (!mounted) return;

    if (success) {
      Navigator.pop(context, true);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(provider.error ?? 'Error al guardar'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final vehicles = context.watch<VehicleProvider>().vehicles;

    return Scaffold(
      appBar: AppBar(title: const Text('Nuevo Recordatorio')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Información',
                          style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary)),
                      const SizedBox(height: 16),
                      DropdownButtonFormField<int>(
                        value: _vehicleId,
                        decoration: const InputDecoration(
                          labelText: 'Vehículo *',
                          prefixIcon: Icon(Icons.directions_car_rounded,
                              color: AppColors.accent),
                        ),
                        items: vehicles.map((v) {
                          return DropdownMenuItem(
                            value: v.id,
                            child: Text(v.fullName),
                          );
                        }).toList(),
                        onChanged: (v) => setState(() => _vehicleId = v),
                        validator: (v) =>
                            v == null ? 'Seleccione un vehículo' : null,
                      ),
                      const SizedBox(height: 14),
                      CustomTextField(
                        controller: _titleController,
                        label: 'Título *',
                        prefixIcon: Icons.title,
                        validator: (v) =>
                            v?.isEmpty == true ? 'Requerido' : null,
                      ),
                      const SizedBox(height: 14),
                      CustomTextField(
                        controller: _descriptionController,
                        label: 'Descripción',
                        prefixIcon: Icons.description,
                        maxLines: 3,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Configuración',
                          style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary)),
                      const SizedBox(height: 16),
                      DropdownButtonFormField<String>(
                        value: _reminderType,
                        decoration: const InputDecoration(
                          labelText: 'Tipo *',
                          prefixIcon:
                              Icon(Icons.category, color: AppColors.accent),
                        ),
                        items: _types.map((t) {
                          final names = {
                            'MILEAGE_BASED': 'Basado en km',
                            'DATE_BASED': 'Basado en fecha',
                            'BOTH': 'Ambos',
                          };
                          return DropdownMenuItem(
                            value: t,
                            child: Text(names[t] ?? t),
                          );
                        }).toList(),
                        onChanged: (v) => setState(() => _reminderType = v),
                        validator: (v) =>
                            v == null ? 'Seleccione un tipo' : null,
                      ),
                      const SizedBox(height: 14),
                      if (_reminderType == 'MILEAGE_BASED' ||
                          _reminderType == 'BOTH')
                        CustomTextField(
                          controller: _mileageController,
                          label: 'Kilometraje límite',
                          prefixIcon: Icons.speed,
                          keyboardType: TextInputType.number,
                        ),
                      if (_reminderType == 'MILEAGE_BASED' ||
                          _reminderType == 'BOTH')
                        const SizedBox(height: 14),
                      if (_reminderType == 'DATE_BASED' ||
                          _reminderType == 'BOTH')
                        InkWell(
                          onTap: _selectDate,
                          child: InputDecorator(
                            decoration: const InputDecoration(
                              labelText: 'Fecha límite',
                              prefixIcon: Icon(Icons.calendar_today,
                                  color: AppColors.accent),
                            ),
                            child: Text(
                              _thresholdDate != null
                                  ? '${_thresholdDate!.day}/${_thresholdDate!.month}/${_thresholdDate!.year}'
                                  : 'Seleccionar fecha',
                            ),
                          ),
                        ),
                      const SizedBox(height: 14),
                      SwitchListTile(
                        title: const Text('¿Recurrente?'),
                        subtitle: const Text('Repetir automáticamente'),
                        value: _isRecurring,
                        activeColor: AppColors.accent,
                        onChanged: (v) =>
                            setState(() => _isRecurring = v),
                      ),
                      if (_isRecurring) ...[
                        const SizedBox(height: 14),
                        CustomTextField(
                          controller: _intervalController,
                          label: 'Intervalo (días)',
                          prefixIcon: Icons.repeat,
                          keyboardType: TextInputType.number,
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Consumer<ReminderProvider>(
                builder: (context, provider, _) {
                  return SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: provider.isLoading ? null : _save,
                      child: provider.isLoading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2, color: Colors.white),
                            )
                          : const Text('Guardar Recordatorio'),
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
