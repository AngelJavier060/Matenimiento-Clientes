import 'package:flutter/material.dart';
import '../config/colors.dart';
import '../models/reminder/reminder_response.dart';

class ReminderCard extends StatelessWidget {
  final ReminderResponse reminder;
  final VoidCallback onTap;
  final VoidCallback? onDelete;

  const ReminderCard({
    super.key,
    required this.reminder,
    required this.onTap,
    this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: reminder.isActive
                      ? AppColors.warning.withOpacity(0.15)
                      : AppColors.textSecondary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(
                  reminder.isActive
                      ? Icons.notifications_active_rounded
                      : Icons.notifications_off_rounded,
                  color: reminder.isActive
                      ? AppColors.warning
                      : AppColors.textSecondary,
                  size: 24,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      reminder.title,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    if (reminder.description != null &&
                        reminder.description!.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(
                        reminder.description!,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        if (reminder.thresholdMileage != null) ...[
                          const Icon(Icons.speed,
                              size: 12, color: AppColors.textSecondary),
                          const SizedBox(width: 2),
                          Text(
                            '${reminder.thresholdMileage} km',
                            style: const TextStyle(
                              fontSize: 11,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                        if (reminder.thresholdDate != null) ...[
                          if (reminder.thresholdMileage != null)
                            const SizedBox(width: 8),
                          const Icon(Icons.calendar_today,
                              size: 12, color: AppColors.textSecondary),
                          const SizedBox(width: 2),
                          Text(
                            reminder.thresholdDate!,
                            style: const TextStyle(
                              fontSize: 11,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
              if (onDelete != null)
                IconButton(
                  icon: const Icon(Icons.delete_outline,
                      color: AppColors.error, size: 18),
                  onPressed: onDelete,
                ),
              Switch(
                value: reminder.isActive,
                onChanged: (_) {},
                activeColor: AppColors.accent,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
