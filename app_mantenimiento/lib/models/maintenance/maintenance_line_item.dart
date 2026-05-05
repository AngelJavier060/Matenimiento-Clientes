class MaintenanceLineItem {
  final int? id;
  final String? lineType;
  final String? description;
  final bool? done;

  MaintenanceLineItem({
    this.id,
    this.lineType,
    this.description,
    this.done,
  });

  factory MaintenanceLineItem.fromJson(Map<String, dynamic> json) =>
      MaintenanceLineItem(
        id: (json['id'] as num?)?.toInt(),
        lineType: json['lineType']?.toString(),
        description: json['description']?.toString(),
        done: json['done'] as bool?,
      );
}
