import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // ═══ الألوان الأساسية ═══
  static const primary = Color(0xFF6366F1);      // بنفسجي أزرق
  static const secondary = Color(0xFF8B5CF6);    // بنفسجي
  static const accent = Color(0xFF06B6D4);       // سماوي
  static const success = Color(0xFF10B981);      // أخضر
  static const warning = Color(0xFFF59E0B);      // برتقالي
  static const danger = Color(0xFFEF4444);       // أحمر

  // ═══ الخلفيات ═══
  static const bgDark = Color(0xFF0A0E1A);
  static const bgCard = Color(0xFF151B2E);
  static const bgCardLight = Color(0xFF1E2638);
  static const border = Color(0xFF2A3348);

  // ═══ النصوص ═══
  static const textPrimary = Color(0xFFF8FAFC);
  static const textSecondary = Color(0xFF94A3B8);
  static const textMuted = Color(0xFF64748B);

  // ═══ التدرجات ═══
  static const gradientPrimary = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
  );

  static const gradientAccent = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF06B6D4), Color(0xFF6366F1)],
  );

  static const gradientSuccess = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF10B981), Color(0xFF06B6D4)],
  );

  // ═══ الثيم الداكن ═══
  static ThemeData get dark => ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        scaffoldBackgroundColor: bgDark,
        colorScheme: const ColorScheme.dark(
          primary: primary,
          secondary: secondary,
          surface: bgCard,
          background: bgDark,
          error: danger,
        ),
        textTheme: GoogleFonts.cairoTextTheme(ThemeData.dark().textTheme)
            .apply(
          bodyColor: textPrimary,
          displayColor: textPrimary,
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.transparent,
          elevation: 0,
          centerTitle: true,
          iconTheme: IconThemeData(color: textPrimary),
        ),
        cardTheme: CardTheme(
          color: bgCard,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
            side: const BorderSide(color: border, width: 1),
          ),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: primary,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
            elevation: 0,
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: bgCardLight,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: const BorderSide(color: border),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: const BorderSide(color: border),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: const BorderSide(color: primary, width: 2),
          ),
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 20,
            vertical: 16,
          ),
        ),
      );

  // ═══ الثيم الفاتح ═══
  static ThemeData get light => ThemeData(
        useMaterial3: true,
        brightness: Brightness.light,
        colorScheme: ColorScheme.fromSeed(seedColor: primary),
        textTheme: GoogleFonts.cairoTextTheme(),
      );
}
