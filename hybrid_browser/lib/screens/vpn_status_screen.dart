import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class VpnStatusScreen extends StatelessWidget {
  const VpnStatusScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('حالة VPN')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            const SizedBox(height: 20),
            Container(
              width: 140,
              height: 140,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: AppTheme.gradientSuccess,
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.success.withOpacity(0.4),
                    blurRadius: 40,
                  ),
                ],
              ),
              child: const Icon(Icons.shield_moon_rounded,
                  color: Colors.white, size: 60),
            ),
            const SizedBox(height: 24),
            const Text(
              'متصل بأمان',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: AppTheme.success,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'الموقع: السعودية • IP: 130.x.x.x',
              style: TextStyle(color: AppTheme.textSecondary),
            ),
            const SizedBox(height: 40),
            _infoCard('البروتوكول', 'WireGuard'),
            _infoCard('السرعة الحالية', '↑ 45 Mbps  ↓ 120 Mbps'),
            _infoCard('مدة الاتصال', '00:34:21'),
            _infoCard('البيانات المستهلكة', '234 MB'),
          ],
        ),
      ),
    );
  }

  Widget _infoCard(String label, String value) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.bgCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.border),
      ),
      child: Row(
        children: [
          Text(label,
              style: const TextStyle(color: AppTheme.textSecondary)),
          const Spacer(),
          Text(value,
              style: const TextStyle(
                  color: AppTheme.textPrimary,
                  fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
