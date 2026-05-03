import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/colors.dart';
import '../../models/vehicle/vehicle_request.dart';
import '../../providers/vehicle_provider.dart';
import '../../widgets/custom_text_field.dart';

class VehicleFormScreen extends StatefulWidget {
  const VehicleFormScreen({super.key});

  @override
  State<VehicleFormScreen> createState() => _VehicleFormScreenState();
}

class _VehicleFormScreenState extends State<VehicleFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _brandController = TextEditingController();
  final _modelController = TextEditingController();
  final _yearController = TextEditingController();
  final _plateController = TextEditingController();
  final _vinController = TextEditingController();
  final _mileageController = TextEditingController();
  final _colorController = TextEditingController();
  final _notesController = TextEditingController();

  String? _fuelType;
  String? _transmission;
  bool _isEditing = false;

  final _fuelTypes = ['GASOLINE', 'DIESEL', 'ELECTRIC', 'HYBRID', 'LPG', 'CNG'];
  final _transmissionTypes = ['MANUAL', 'AUTOMATIC', 'CVT', 'DCT'];

  @override
  void initState() {
    super.initState();
    final vehicle = context.read<VehicleProvider>().selectedVehicle;
    if (vehicle != null) {
      _isEditing = true;
      _brandController.text = vehicle.brand;
      _modelController.text = vehicle.model;
      _yearController.text = vehicle.year.toString();
      _plateController.text = vehicle.licensePlate ?? '';
      _vinController.text = vehicle.vin ?? '';
      _mileageController.text = vehicle.mileage?.toString() ?? '';
      _colorController.text = vehicle.color ?? '';
      _notesController.text = vehicle.notes ?? '';
      _fuelType = vehicle.fuelType;
      _transmission = vehicle.transmission;
    }
  }

  @override
  void dispose() {
    _brandController.dispose();
    _modelController.dispose();
    _yearController.dispose();
    _plateController.dispose();
    _vinController.dispose();
    _mileageController.dispose();
    _colorController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    final provider = context.read<VehicleProvider>();
    final request = VehicleRequest(
      brand: _brandController.text.trim(),
      model: _modelController.text.trim(),
      year: int.parse(_yearController.text.trim()),
      licensePlate:
          _plateController.text.trim().isEmpty ? null : _plateController.text.trim(),
      vin: _vinController.text.trim().isEmpty ? null : _vinController.text.trim(),
      mileage: _mileageController.text.trim().isEmpty
          ? null
          : int.parse(_mileageController.text.trim()),
      fuelType: _fuelType,
      transmission: _transmission,
      color: _colorController.text.trim().isEmpty ? null : _colorController.text.trim(),
      notes: _notesController.text.trim().isEmpty ? null : _notesController.text.trim(),
    );

    bool success;
    if (_isEditing) {
      success = await provider.updateVehicle(
          provider.selectedVehicle!.id, request);
    } else {
      success = await provider.createVehicle(request);
    }

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
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEditing ? 'Editar Vehículo' : 'Nuevo Vehículo'),
      ),
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
                      const Text('Información del Vehículo',
                          style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary)),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: CustomTextField(
                              controller: _brandController,
                              label: 'Marca *',
                              prefixIcon: Icons.business,
                              validator: (v) =>
                                  v?.isEmpty == true ? 'Requerido' : null,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: CustomTextField(
                              controller: _modelController,
                              label: 'Modelo *',
                              prefixIcon: Icons.model_training,
                              validator: (v) =>
                                  v?.isEmpty == true ? 'Requerido' : null,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      Row(
                        children: [
                          Expanded(
                            child: CustomTextField(
                              controller: _yearController,
                              label: 'Año *',
                              prefixIcon: Icons.calendar_today,
                              keyboardType: TextInputType.number,
                              validator: (v) {
                                if (v?.isEmpty == true) return 'Requerido';
                                final year = int.tryParse(v!);
                                if (year == null || year < 1900 || year > 2030) {
                                  return 'Año inválido';
                                }
                                return null;
                              },
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: CustomTextField(
                              controller: _plateController,
                              label: 'Placa',
                              prefixIcon: Icons.confirmation_number,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      CustomTextField(
                        controller: _vinController,
                        label: 'VIN (17 caracteres)',
                        prefixIcon: Icons.qr_code,
                        maxLines: 1,
                      ),
                      const SizedBox(height: 14),
                      Row(
                        children: [
                          Expanded(
                            child: CustomTextField(
                              controller: _mileageController,
                              label: 'Kilometraje',
                              prefixIcon: Icons.speed,
                              keyboardType: TextInputType.number,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: CustomTextField(
                              controller: _colorController,
                              label: 'Color',
                              prefixIcon: Icons.palette,
                            ),
                          ),
                        ],
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
                      const Text('Especificaciones',
                          style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary)),
                      const SizedBox(height: 16),
                      DropdownButtonFormField<String>(
                        value: _fuelType,
                        decoration: const InputDecoration(
                          labelText: 'Tipo de combustible',
                          prefixIcon:
                              Icon(Icons.local_gas_station, color: AppColors.accent),
                        ),
                        items: _fuelTypes.map((t) {
                          final names = {
                            'GASOLINE': 'Gasolina',
                            'DIESEL': 'Diesel',
                            'ELECTRIC': 'Eléctrico',
                            'HYBRID': 'Híbrido',
                            'LPG': 'GLP',
                            'CNG': 'GNC',
                          };
                          return DropdownMenuItem(
                            value: t,
                            child: Text(names[t] ?? t),
                          );
                        }).toList(),
                        onChanged: (v) => setState(() => _fuelType = v),
                      ),
                      const SizedBox(height: 14),
                      DropdownButtonFormField<String>(
                        value: _transmission,
                        decoration: const InputDecoration(
                          labelText: 'Transmisión',
                          prefixIcon:
                              Icon(Icons.settings, color: AppColors.accent),
                        ),
                        items: _transmissionTypes.map((t) {
                          final names = {
                            'MANUAL': 'Manual',
                            'AUTOMATIC': 'Automática',
                            'CVT': 'CVT',
                            'DCT': 'DCT',
                          };
                          return DropdownMenuItem(
                            value: t,
                            child: Text(names[t] ?? t),
                          );
                        }).toList(),
                        onChanged: (v) => setState(() => _transmission = v),
                      ),
                      const SizedBox(height: 14),
                      CustomTextField(
                        controller: _notesController,
                        label: 'Notas',
                        prefixIcon: Icons.notes,
                        maxLines: 3,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Consumer<VehicleProvider>(
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
                          : Text(
                              _isEditing
                                  ? 'Actualizar Vehículo'
                                  : 'Guardar Vehículo',
                            ),
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
