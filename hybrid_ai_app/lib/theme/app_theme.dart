import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  static const primary = Color(0xFF6366F1);
  static const accent = Color(0xFF8B5CF6);
  static const bgLight = Color(0xFFF8FAFC);
  static const bgDark = Color(0xFF0F172A);

  static ThemeData get light => ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: primary,
          brightness: Brightness.light,
        ),
        scaffoldBackgroundColor: bgLight,
        textTheme: GoogleFonts.cairoTextTheme(),
        appBarTheme: const AppBarTheme(
          centerTitle: true,
          elevation: 0,
          backgroundColor: Colors.transparent,
        ),
      );

  static ThemeData get dark => ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: primary,
          brightness: Brightness.dark,
        ),
        scaffoldBackgroundColor: bgDark,
        textTheme: GoogleFonts.cairoTextTheme(ThemeData.dark().textTheme),
        appBarTheme: const AppBarTheme(
          centerTitle: true,
          elevation: 0,
          backgroundColor: Colors.transparent,
        ),
      );
}
