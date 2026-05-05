# app_mantenimiento

App móvil (Flutter). La API usa `lib/config/api_config.dart`: por defecto apunta al emulador (`10.0.2.2`) si no definís **`API_BASE_URL`**.

## Apuntar a producción y generar APK (instalar en el teléfono)

1. Sustituí **`TU_DOMINIO`** por tu URL real (la misma donde abrís la web con HTTPS):

```powershell
cd app_mantenimiento
flutter pub get
flutter build apk --release `
  --dart-define=API_BASE_URL=https://TU_DOMINIO/api
```

Ejemplo con tu despliegue:

```powershell
flutter build apk --release --dart-define=API_BASE_URL=https://mantenimiento.improvement-solution.com/api
```

2. Copiá el APK al móvil (USB, Telegram, Drive, etc.):

**`build\app\outputs\flutter-apk\app-release.apk`**

3. En Android: **Ajustes → Seguridad** (o aplicaciones) permitir **orígenes desconocidos** e instalá el `.apk`.

**APKs más livianos** (uno por procesador):

```powershell
flutter build apk --release --split-per-abi `
  --dart-define=API_BASE_URL=https://mantenimiento.improvement-solution.com/api
```

(salen bajo `build\app\outputs\flutter-apk\app-*-release.apk`.)

### Probar en el teléfono con cable (USB)

```powershell
flutter devices
flutter run --release `
  --dart-define=API_BASE_URL=https://mantenimiento.improvement-solution.com/api
```

### Probar igual que en servidor (solo Wi‑Fi local al PC)

```powershell
flutter run --dart-define=API_BASE_URL=http://TU_IP_PC:9088/api
```

(Spring en Docker en el servidor no aplica desde el celular fuera de la red.)

## Getting Started

This project is a starting point for a Flutter application.

A few resources to get you started if this is your first Flutter project:

- [Lab: Write your first Flutter app](https://docs.flutter.dev/get-started/codelab)
- [Cookbook: Useful Flutter samples](https://docs.flutter.dev/cookbook)

For help getting started with Flutter development, view the
[online documentation](https://docs.flutter.dev/), which offers tutorials,
samples, guidance on mobile development, and a full API reference.
