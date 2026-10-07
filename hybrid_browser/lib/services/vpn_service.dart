import 'dart:async';

/// خدمة VPN — تعمل بصمت، لا واجهة
/// تعتمد على WireGuard الذي أعددناه على Oracle Cloud
class VpnService {
  static final VpnService _instance = VpnService._();
  factory VpnService() => _instance;
  VpnService._();

  bool isConnected = false;
  String? location;
  Timer? _heartbeat;

  /// تشغيل تلقائي عند فتح التطبيق
  Future<void> autoConnect() async {
    // في التطبيق الحقيقي: استدعاء WireGuard عبر Method Channel
    // هنا نحاكي الاتصال
    await Future.delayed(const Duration(milliseconds: 300));
    isConnected = true;
    location = 'السعودية';

    // فحص دوري للاتصال
    _heartbeat?.cancel();
    _heartbeat = Timer.periodic(const Duration(seconds: 30), (_) {
      _checkHealth();
    });
  }

  Future<void> _checkHealth() async {
    // فحص أن النفق ما زال قائمًا
    // إن انقطع، يعاد الاتصال تلقائيًا
  }

  Future<void> toggle() async {
    if (isConnected) {
      isConnected = false;
      location = null;
      _heartbeat?.cancel();
    } else {
      await autoConnect();
    }
  }

  void dispose() {
    _heartbeat?.cancel();
  }
}
