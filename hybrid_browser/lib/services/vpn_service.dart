import 'dart:convert';
import 'package:http/http.dart' as http;
import 'media_api.dart';

class VpnService {
  static Future<Map<String, dynamic>> getVpnStatus() async {
    final base = await MediaApi.getServer();
    final res = await http
        .get(Uri.parse('$base/api/vpn'))
        .timeout(const Duration(seconds: 10));
    if (res.statusCode != 200) {
      throw Exception('فشل جلب حالة VPN');
    }
    return jsonDecode(utf8.decode(res.bodyBytes));
  }
}
