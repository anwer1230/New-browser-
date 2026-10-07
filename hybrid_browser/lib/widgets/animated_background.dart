import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// خلفية متحركة — دوائر متوهجة ناعمة
class AnimatedBackground extends StatefulWidget {
  final Widget child;
  const AnimatedBackground({super.key, required this.child});

  @override
  State<AnimatedBackground> createState() => _AnimatedBackgroundState();
}

class _AnimatedBackgroundState extends State<AnimatedBackground>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 20),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // الخلفية الأساسية
        Container(color: AppTheme.bgDark),

        // دائرة 1 — بنفسجية
        AnimatedBuilder(
          animation: _controller,
          builder: (_, __) => Positioned(
            top: -100 + (80 * _controller.value),
            right: -50 + (60 * _controller.value),
            child: Container(
              width: 320,
              height: 320,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    AppTheme.primary.withOpacity(0.35),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),
        ),

        // دائرة 2 — سماوية
        AnimatedBuilder(
          animation: _controller,
          builder: (_, __) => Positioned(
            bottom: -80 - (60 * _controller.value),
            left: -40 + (80 * _controller.value),
            child: Container(
              width: 280,
              height: 280,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    AppTheme.accent.withOpacity(0.25),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),
        ),

        // دائرة 3 — فيروزية
        Positioned(
          top: MediaQuery.of(context).size.height * 0.4,
          right: -100,
          child: Container(
            width: 200,
            height: 200,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: [
                  AppTheme.secondary.withOpacity(0.15),
                  Colors.transparent,
                ],
              ),
            ),
          ),
        ),

        // المحتوى
        widget.child,
      ],
    );
  }
}
