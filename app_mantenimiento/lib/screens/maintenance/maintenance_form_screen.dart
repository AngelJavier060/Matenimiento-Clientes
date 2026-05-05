import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/colors.dart';
import '../../models/maintenance/maintenance_request.dart';
import '../../providers/maintenance_provider.dart';
import '../../providers/vehicle_provider.dart';
import '../../widgets/custom_text_field.dart';

class MaintenanceFormArgs {
  final int? initialVehicleId;
  /// Coincide con el filtro del listado Angular (`categoria=correctivo|preventivo`).
  final String? defaultServiceCategory;

  const MaintenanceFormArgs({
    this.initialVehicleId,
    this.defaultServiceCategory,
  });
}

class MaintenanceFormScreen extends StatefulWidget {
  const MaintenanceFormScreen({super.key});

  @override
  State<MaintenanceFormScreen> createState() => _MaintenanceFormScreenState();
}

class _MaintenanceFormScreenState extends State<MaintenanceFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _serviceTypeController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _mileageController = TextEditingController();
  final _costController = TextEditingController();
  final _nextMileageController = TextEditingController();
  final _workshopController = TextEditingController();
  final _workshopAddressController = TextEditingController();
  final _notesController = TextEditingController();

  int? _vehicleId;
  String? _status;
  String _serviceCategory = 'MIXED';
  DateTime? _serviceDate;
  DateTime? _nextServiceDate;

  final _statuses = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
  final _categories = ['MIXED', 'PREVENTIVE', 'CORRECTIVE'];

  void _consumeRouteArgs(BuildContext ctx) {
    final r = ModalRoute.of(ctx)?.settings.arguments;
    if (r is! MaintenanceFormArgs) return;

    final args = r;
    if (args.initialVehicleId != null) {
      _vehicleId ??= args.initialVehicleId;
    }
    final dsc = args.defaultServiceCategory?.toUpperCase();
    if (dsc != null && _categories.contains(dsc)) {
      _serviceCategory = dsc;
    }
  }

  String _isoDate(DateTime d) =>
      '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _consumeRouteArgs(context);
      context.read<VehicleProvider>().loadVehicles();
      setState(() {});
    });
  }

  @override
  void dispose() {
    _serviceTypeController.dispose();
    _descriptionController.dispose();
    _mileageController.dispose();
    _costController.dispose();
    _nextMileageController.dispose();
    _workshopController.dispose();
    _workshopAddressController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _selectDate(bool isService) async {
    final date = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime(2020),
      lastDate: DateTime(2030),
    );
    if (date != null) {
      setState(() {
        if (isService) {
          _serviceDate = date;
        } else {
          _nextServiceDate = date;
        }
      });
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    if (_serviceDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content:
              const Text('La fecha del servicio es obligatoria'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    final provider = context.read<MaintenanceProvider>();
    final mileageText = _mileageController.text.trim();
    final int? mileageParsed =
        mileageText.isEmpty ? null : int.tryParse(mileageText);

    final request = MaintenanceRequest(
      vehicleId: _vehicleId!,
      serviceType: _serviceTypeController.text.trim(),
      description: _descriptionController.text.trim().isEmpty
          ? null
          : _descriptionController.text.trim(),
      mileageAtService: mileageParsed,
      odometerStatus: mileageParsed != null ? 'KNOWN' : null,
      serviceCategory: _serviceCategory,
      cost: _costController.text.trim().isEmpty
          ? null
          : double.tryParse(_costController.text.trim()),
      serviceDate: _isoDate(_serviceDate!),
      nextServiceMileage: _nextMileageController.text.trim().isEmpty
          ? null
          : int.tryParse(_nextMileageController.text.trim()),
      nextServiceDate:
          _nextServiceDate != null ? _isoDate(_nextServiceDate!) : null,
      workshopName: _workshopController.text.trim().isEmpty
          ? null
          : _workshopController.text.trim(),
      workshopAddress: _workshopAddressController.text.trim().isEmpty
          ? null
          : _workshopAddressController.text.trim(),
      status: _status,
      notes: _notesController.text.trim().isEmpty
          ? null
          : _notesController.text.trim(),
    );

    final success = await provider.createMaintenance(request);
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
      appBar: AppBar(title: const Text('Nuevo Mantenimiento')),
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
                      const Text(
                        'Datos del Servicio',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 16),
                      DropdownButtonFormField<int>(
                        isExpanded: true,
                        value: _vehicleId,
                        decoration: const InputDecoration(
                          labelText: 'Vehículo *',
                          prefixIcon: Icon(Icons.directions_car_rounded,
                              color: AppColors.accent),
                        ),
                        selectedItemBuilder: (ctx) =>
                            vehicles.map((v) {
                              return Align(
                                alignment: Alignment.centerLeft,
                                child: Text(
                                  v.marcaPlacaLabel,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              );
                            }).toList(),
                        items: vehicles.map((v) {
                          return DropdownMenuItem(
                            value: v.id,
                            child: Text(
                              v.marcaPlacaLabel,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          );
                        }).toList(),
                        onChanged: (v) => setState(() => _vehicleId = v),
                        validator: (v) =>
                            v == null ? 'Seleccione un vehículo' : null,
                      ),
                      const SizedBox(height: 14),
                      CustomTextField(
                        controller: _serviceTypeController,
                        label: 'Tipo de servicio *',
                        prefixIcon: Icons.build,
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
                      const SizedBox(height: 14),
                      DropdownButtonFormField<String>(
                        value: _serviceCategory,
                        decoration: const InputDecoration(
                          labelText: 'Categoría del servicio',
                          prefixIcon:
                              Icon(Icons.category, color: AppColors.accent),
                        ),
                        items: _categories.map((c) {
                          final labels = {
                            'MIXED': 'Mixto',
                            'PREVENTIVE': 'Preventivo',
                            'CORRECTIVE': 'Correctivo',
                          };
                          return DropdownMenuItem(
                            value: c,
                            child: Text(labels[c] ?? c),
                          );
                        }).toList(),
                        onChanged: (v) {
                          if (v != null) {
                            setState(() => _serviceCategory = v);
                          }
                        },
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
                      const Text(
                        'Detalles',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 16),
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
                              controller: _costController,
                              label: 'Costo (\$)',
                              prefixIcon: Icons.attach_money,
                              keyboardType: TextInputType.number,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      InkWell(
                        onTap: () => _selectDate(true),
                        child: InputDecorator(
                          decoration: const InputDecoration(
                            labelText: 'Fecha del servicio *',
                            prefixIcon: Icon(Icons.calendar_today,
                                color: AppColors.accent),
                          ),
                          child: Text(
                            _serviceDate != null
                                ? '${_serviceDate!.day}/${_serviceDate!.month}/${_serviceDate!.year}'
                                : 'Seleccionar fecha',
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),
                      DropdownButtonFormField<String>(
                        value: _status,
                        decoration: const InputDecoration(
                          labelText: 'Estado',
                          prefixIcon: Icon(Icons.flag, color: AppColors.accent),
                        ),
                        items: _statuses.map((s) {
                          final names = {
                            'SCHEDULED': 'Programado',
                            'IN_PROGRESS': 'En Progreso',
                            'COMPLETED': 'Completado',
                            'CANCELLED': 'Cancelado',
                          };
                          return DropdownMenuItem(
                            value: s,
                            child: Text(names[s] ?? s),
                          );
                        }).toList(),
                        onChanged: (v) => setState(() => _status = v),
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
                      const Text(
                        'Próximo Servicio & Taller',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 16),
                      CustomTextField(
                        controller: _nextMileageController,
                        label: 'Próximo km',
                        prefixIcon: Icons.speed,
                        keyboardType: TextInputType.number,
                      ),
                      const SizedBox(height: 14),
                      InkWell(
                        onTap: () => _selectDate(false),
                        child: InputDecorator(
                          decoration: const InputDecoration(
                            labelText: 'Próxima fecha',
                            prefixIcon: Icon(Icons.date_range,
                                color: AppColors.accent),
                          ),
                          child: Text(
                            _nextServiceDate != null
                                ? '${_nextServiceDate!.day}/${_nextServiceDate!.month}/${_nextServiceDate!.year}'
                                : 'Seleccionar fecha',
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),
                      CustomTextField(
                        controller: _workshopController,
                        label: 'Taller',
                        prefixIcon: Icons.store,
                      ),
                      const SizedBox(height: 14),
                      CustomTextField(
                        controller: _workshopAddressController,
                        label: 'Dirección del taller',
                        prefixIcon: Icons.location_on,
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
              Consumer<MaintenanceProvider>(
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
                          : const Text('Guardar Mantenimiento'),
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
