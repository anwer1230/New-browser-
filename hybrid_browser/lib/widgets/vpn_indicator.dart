import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class VpnIndicator extends StatelessWidget {
  final bool active;
  final String? location;
  final VoidCallback? onTap;

  const VpnIndicator({
    super.key,
    required this.active,
    this.location,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: active
              ? AppTheme.success.withOpacity(0.15)
              : AppTheme.danger.withOpacity(0.15),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: active
                ? AppTheme.success.withOpacity(0.4)
                : AppTheme.danger.withOpacity(0.4),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            // نقطة نابضة
            _PulsingDot(color: active ? AppTheme.success : AppTheme.danger),
            const SizedBox(width: 8),
            Text(
              active ? 'VPN آمن' : 'VPN غير مفعّل',
              style: TextStyle(
                color: active ? AppTheme.success : AppTheme.danger,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
            if (active && location != null) ...[
              const SizedBox(width: 6),
              Container(
                width: 1,
                height: 12,
                color: AppTheme.success.withOpacity(0.4),
              ),
              const SizedBox(width: 6),
              Text(
                location!,
                style: const TextStyle(
                  color: AppTheme.textSecondary,
                  fontSize: 11,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _PulsingDot extends StatefulWidget {
  final Color color;
  const _PulsingDot({required this.color});

  @override
  State<_PulsingDot> createState() => _PulsingDotState();
}

class _PulsingDotState extends State<_PulsingDot>
    with SingleTickerProviderStateMixin {
  late AnimationController _c;

  @override
  void initState() {
    super.initState();
    _c = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat();
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _c,
      builder: (_, __) {
        return Stack(
          alignment: Alignment.center,
          children: [
            Container(
              width: 12 + (6 * _c.value),
              height: 12 + (6 * _c.value),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: widget.color.withOpacity(0.3 * (1 - _c.value)),
              ),
            ),
            Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: widget.color,
                boxShadow: [
                  BoxShadow(
                    color: widget.color.withOpacity(0.6),
                    blurRadius: 8,
                  ),
                ],
              ),
            ),
          ],
        );
      },
    );
  }
}
