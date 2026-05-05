import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../config/colors.dart';
import '../../models/client/client_response.dart';
import '../../models/maintenance_plan/maintenance_plan_response.dart';
import '../../models/vehicle/vehicle_request.dart';
import '../../models/vehicle/vehicle_response.dart';
import '../../providers/vehicle_provider.dart';
import '../../services/client_service.dart';
import '../../services/maintenance_plan_service.dart';
import '../../utils/vehicle_image_url.dart';
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
  final _imageUrlController = TextEditingController();
  final _nextKmController = TextEditingController();

  String? _fuelType;
  String? _transmission;
  bool _isEditing = false;
  DateTime? _nextCommittedDate;
  bool _depsLoading = true;
  int? _clientId;
  int? _maintenancePlanId;

  List<ClientResponse> _clients = [];
  List<MaintenancePlanResponse> _plans = [];

  final ImagePicker _imagePicker = ImagePicker();
  XFile? _pickedPhoto;

  final _fuelTypes = ['GASOLINE', 'DIESEL', 'ELECTRIC', 'HYBRID', 'LPG', 'CNG'];
  final _transmissionTypes = ['MANUAL', 'AUTOMATIC', 'CVT', 'DCT'];

  void _clearPickedPhoto() {
    setState(() => _pickedPhoto = null);
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final file = await _imagePicker.pickImage(
        source: source,
        maxWidth: 1920,
        maxHeight: 1920,
        imageQuality: 85,
      );
      if (file != null) {
        setState(() => _pickedPhoto = file);
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content:
                Text('No se pudo abrir la cámara o la galería (permiso denegado).'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  /// Vista previa: archivo elegido primero; si no, URL manual/tipo servidor.
  Widget _photoPreviewBox(VehicleResponse? editingVehicle) {
    if (_pickedPhoto != null) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(14),
        child: AspectRatio(
          aspectRatio: 16 / 9,
          child: Image.file(
            File(_pickedPhoto!.path),
            fit: BoxFit.cover,
          ),
        ),
      );
    }

    final manualUrl = _imageUrlController.text.trim();
    final relOrAbs = manualUrl.isNotEmpty
        ? VehicleImageUrl.resolve(manualUrl)
        : VehicleImageUrl.resolve(editingVehicle?.imageUrl);

    if (relOrAbs != null &&
        (relOrAbs.startsWith('http://') || relOrAbs.startsWith('https://'))) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(14),
        child: AspectRatio(
          aspectRatio: 16 / 9,
          child: Image.network(
            relOrAbs,
            fit: BoxFit.cover,
            errorBuilder: (_, __, ___) => _photoPlaceholder(),
          ),
        ),
      );
    }

    return _photoPlaceholder();
  }

  Widget _photoPlaceholder() {
    return AspectRatio(
      aspectRatio: 16 / 9,
      child: Container(
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: AppColors.accent.withOpacity(0.08),
          borderRadius: BorderRadius.circular(14),
        ),
        child: const Icon(Icons.directions_car_rounded,
            size: 56, color: AppColors.accent),
      ),
    );
  }

  DateTime? _parseIsoDate(String? s) {
    if (s == null || s.isEmpty) return null;
    try {
      return DateTime.parse(s);
    } catch (_) {
      return null;
    }
  }

  void _scheduleImagePreviewRebuild() {
    if (mounted) setState(() {});
  }

  @override
  void initState() {
    super.initState();
    _imageUrlController.addListener(_scheduleImagePreviewRebuild);
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
      _imageUrlController.text = vehicle.imageUrl ?? '';
      _fuelType = vehicle.fuelType;
      _transmission = vehicle.transmission;
      _clientId = vehicle.clientId;
      _maintenancePlanId = vehicle.maintenancePlanId;
      _nextKmController.text =
          vehicle.nextCommittedServiceMileage?.toString() ?? '';
      _nextCommittedDate = _parseIsoDate(vehicle.nextCommittedServiceDate);
    }

    WidgetsBinding.instance.addPostFrameCallback((_) => _loadDependencies());
  }

  Future<void> _loadDependencies() async {
    setState(() => _depsLoading = true);
    try {
      final cs = ClientService();
      final ps = MaintenancePlanService();
      final results = await Future.wait([
        cs.getClients(),
        ps.getAllPlans(),
      ]);
      _clients = results[0] as List<ClientResponse>;
      _plans = results[1] as List<MaintenancePlanResponse>;

      final vehicle = context.read<VehicleProvider>().selectedVehicle;
      if (vehicle?.maintenancePlanId != null) {
        final id = vehicle!.maintenancePlanId!;
        final found = _plans.any((p) => p.id == id);
        if (!found && id > 0) {
          _plans = [
            ..._plans,
            MaintenancePlanResponse(id: id, marca: '?', modelo: '?', anio: 0),
          ];
        }
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('No se pudieron cargar clientes ni planes.'),
            backgroundColor: AppColors.warning,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _depsLoading = false);
    }
  }

  Future<void> _selectCommittedDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _nextCommittedDate ?? DateTime.now(),
      firstDate: DateTime(2020),
      lastDate: DateTime(2050),
    );
    if (date != null) {
      setState(() => _nextCommittedDate = date);
    }
  }

  void _clearCommittedDate() {
    setState(() => _nextCommittedDate = null);
  }

  @override
  void dispose() {
    _imageUrlController.removeListener(_scheduleImagePreviewRebuild);
    _brandController.dispose();
    _modelController.dispose();
    _yearController.dispose();
    _plateController.dispose();
    _vinController.dispose();
    _mileageController.dispose();
    _colorController.dispose();
    _notesController.dispose();
    _imageUrlController.dispose();
    _nextKmController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    final provider = context.read<VehicleProvider>();
    final mileageText = _mileageController.text.trim();
    final nextKmText = _nextKmController.text.trim();

    final manualImageUrl = (_pickedPhoto == null &&
            _imageUrlController.text.trim().isNotEmpty)
        ? _imageUrlController.text.trim()
        : null;

    final request = VehicleRequest(
      brand: _brandController.text.trim(),
      model: _modelController.text.trim(),
      year: int.parse(_yearController.text.trim()),
      licensePlate:
          _plateController.text.trim().isEmpty ? null : _plateController.text.trim(),
      vin: _vinController.text.trim().isEmpty ? null : _vinController.text.trim(),
      mileage: mileageText.isEmpty ? null : int.tryParse(mileageText),
      fuelType: _fuelType,
      transmission: _transmission,
      color: _colorController.text.trim().isEmpty ? null : _colorController.text.trim(),
      imageUrl: manualImageUrl,
      clientId: _clientId,
      notes: _notesController.text.trim().isEmpty ? null : _notesController.text.trim(),
      maintenancePlanId: _maintenancePlanId,
      nextCommittedServiceMileage:
          nextKmText.isEmpty ? null : int.tryParse(nextKmText),
      nextCommittedServiceDate: _nextCommittedDate != null
          ? '${_nextCommittedDate!.year}-${_nextCommittedDate!.month.toString().padLeft(2, '0')}-${_nextCommittedDate!.day.toString().padLeft(2, '0')}'
          : null,
    );

    bool success = false;
    VehicleResponse? afterSave;

    if (_isEditing) {
      final id = provider.selectedVehicle!.id;
      success = await provider.updateVehicle(id, request);
      if (success) {
        afterSave = provider.selectedVehicle;
      }
    } else {
      afterSave = await provider.createVehicle(request);
      success = afterSave != null;
    }

    if (!mounted) return;

    if (success && _pickedPhoto != null && afterSave != null) {
      final okPhoto = await provider.uploadVehiclePhoto(
        vehicleId: afterSave.id,
        localFilePath: _pickedPhoto!.path,
      );
      if (!okPhoto && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              provider.error ?? 'Vehículo guardado pero la foto no se subió',
            ),
            backgroundColor: AppColors.warning,
          ),
        );
      }
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

  Widget _vehiclePhotoSection(VehicleResponse? editingVehicle) {
    final busySaving = context.watch<VehicleProvider>().isLoading;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Foto del vehículo',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Hasta 2 MB, solo imagen. Se sube al guardar la ficha.',
              style: TextStyle(
                  fontSize: 12,
                  color: AppColors.textSecondary.withOpacity(0.95)),
            ),
            const SizedBox(height: 14),
            _photoPreviewBox(editingVehicle),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed:
                        busySaving ? null : () => _pickImage(ImageSource.gallery),
                    icon: const Icon(Icons.photo_library_outlined, size: 20),
                    label: const Text('Galería'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed:
                        busySaving ? null : () => _pickImage(ImageSource.camera),
                    icon: const Icon(Icons.photo_camera_outlined, size: 20),
                    label: const Text('Cámara'),
                  ),
                ),
              ],
            ),
            if (_pickedPhoto != null) ...[
              const SizedBox(height: 8),
              TextButton.icon(
                onPressed: busySaving ? null : _clearPickedPhoto,
                icon: const Icon(Icons.cancel_outlined, size: 20),
                label: const Text('Quitar imagen elegida'),
              ),
            ],
            const SizedBox(height: 8),
            CustomTextField(
              controller: _imageUrlController,
              label: 'O pegar URL de imagen (opcional)',
              prefixIcon: Icons.link,
            ),
          ],
        ),
      ),
    );
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
              if (_depsLoading)
                const Padding(
                  padding: EdgeInsets.only(bottom: 12),
                  child: LinearProgressIndicator(),
                ),
              _vehiclePhotoSection(
                _isEditing
                    ? context.watch<VehicleProvider>().selectedVehicle
                    : null,
              ),
              const SizedBox(height: 12),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Información del Vehículo',
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
                      const SizedBox(height: 14),
                      DropdownButtonFormField<int?>(
                        value: _clientId,
                        decoration: const InputDecoration(
                          labelText: 'Cliente (opcional)',
                          prefixIcon: Icon(Icons.person, color: AppColors.accent),
                        ),
                        items: [
                          const DropdownMenuItem<int?>(
                            value: null,
                            child: Text('Sin cliente asignado'),
                          ),
                          ..._clients.map(
                            (c) => DropdownMenuItem<int?>(
                              value: c.id,
                              child: Text(
                                c.phone != null && c.phone!.isNotEmpty
                                    ? '${c.fullName} · ${c.phone}'
                                    : c.fullName,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ),
                        ],
                        onChanged: (v) => setState(() => _clientId = v),
                      ),
                      const SizedBox(height: 14),
                      DropdownButtonFormField<int?>(
                        value: _maintenancePlanId,
                        decoration: const InputDecoration(
                          labelText: 'Plan preventivo fijo',
                          prefixIcon:
                              Icon(Icons.folder_special, color: AppColors.accent),
                        ),
                        items: [
                          const DropdownMenuItem<int?>(
                            value: null,
                            child: Text('Sin plan fijo (sólo emparejo MMY)'),
                          ),
                          ..._plans
                              .where((p) => p.isActive != false)
                              .map(
                                (p) => DropdownMenuItem<int?>(
                                  value: p.id,
                                  child: Text(
                                    '${p.summary}${p.activityCount != 0 ? " · ${p.activityCount}" : ""}',
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ),
                        ],
                        onChanged: (v) =>
                            setState(() => _maintenancePlanId = v),
                      ),
                      const SizedBox(height: 14),
                      Row(
                        children: [
                          Expanded(
                            child: CustomTextField(
                              controller: _nextKmController,
                              label: 'Próximo servicio pactado (km)',
                              prefixIcon: Icons.flag,
                              keyboardType: TextInputType.number,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Fecha pactada',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: AppColors.textSecondary,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Row(
                                  children: [
                                    Expanded(
                                      child: OutlinedButton.icon(
                                        onPressed: _selectCommittedDate,
                                        icon: const Icon(Icons.event, size: 18),
                                        label: Text(
                                          _nextCommittedDate != null
                                              ? '${_nextCommittedDate!.day}/${_nextCommittedDate!.month}/${_nextCommittedDate!.year}'
                                              : 'Elegir',
                                        ),
                                      ),
                                    ),
                                    if (_nextCommittedDate != null)
                                      IconButton(
                                        onPressed: _clearCommittedDate,
                                        tooltip: 'Quitar',
                                        icon: const Icon(Icons.clear),
                                      ),
                                  ],
                                ),
                              ],
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
                      const Text(
                        'Especificaciones',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
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
                      onPressed:
                          provider.isLoading || _depsLoading ? null : _save,
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
