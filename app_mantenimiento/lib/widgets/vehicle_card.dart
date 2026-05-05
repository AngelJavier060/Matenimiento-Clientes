import 'package:flutter/material.dart';
import '../config/colors.dart';
import '../models/vehicle/vehicle_response.dart';
import '../utils/vehicle_image_url.dart';

class VehicleCard extends StatelessWidget {
  final VehicleResponse vehicle;
  final VoidCallback onTap;
  final VoidCallback? onDelete;

  const VehicleCard({
    super.key,
    required this.vehicle,
    required this.onTap,
    this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final thumb = VehicleImageUrl.resolve(vehicle.imageUrl);
    final hasPhoto = VehicleImageUrl.canLoadNetwork(vehicle.imageUrl);

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: SizedBox(
                  width: 56,
                  height: 56,
                  child: hasPhoto && thumb != null
                      ? Image.network(
                          thumb,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => _placeholder(),
                        )
                      : _placeholder(),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      vehicle.fullName,
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        if (vehicle.licensePlate != null) ...[
                          const Icon(Icons.confirmation_number,
                              size: 14, color: AppColors.textSecondary),
                          const SizedBox(width: 4),
                          Flexible(
                            flex: 2,
                            child: Text(
                              vehicle.licensePlate!,
                              style: const TextStyle(
                                fontSize: 13,
                                color: AppColors.textSecondary,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 8),
                        ],
                        const Icon(Icons.speed,
                            size: 14, color: AppColors.textSecondary),
                        const SizedBox(width: 4),
                        Flexible(
                          flex: vehicle.licensePlate != null ? 3 : 1,
                          child: Text(
                            '${vehicle.mileage ?? 0} km',
                            style: const TextStyle(
                              fontSize: 13,
                              color: AppColors.textSecondary,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              if (onDelete != null)
                IconButton(
                  visualDensity: VisualDensity.compact,
                  padding: EdgeInsets.zero,
                  constraints:
                      const BoxConstraints(minWidth: 40, minHeight: 40),
                  icon: const Icon(Icons.delete_outline,
                      color: AppColors.error, size: 22),
                  onPressed: onDelete,
                ),
              const SizedBox(
                width: 28,
                child: Icon(Icons.chevron_right,
                    size: 22, color: AppColors.textSecondary),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _placeholder() {
    return Container(
      color: AppColors.accent.withOpacity(0.12),
      child: const Icon(
        Icons.directions_car_rounded,
        color: AppColors.accent,
        size: 28,
      ),
    );
  }
}
