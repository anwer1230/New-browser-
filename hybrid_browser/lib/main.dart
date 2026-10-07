import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'browser_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.dark,
    systemNavigationBarColor: Color(0xFFF1F3F4),
    systemNavigationBarIconBrightness: Brightness.dark,
  ));
  runApp(const HybridBrowserApp());
}

class HybridBrowserApp extends StatelessWidget {
  const HybridBrowserApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'المتصفح',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.light,
        scaffoldBackgroundColor: const Color(0xFFF8F9FA),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF1A73E8),
          brightness: Brightness.light,
        ),
      ),
      locale: const Locale('ar'),
      builder: (context, child) => Directionality(
        textDirection: TextDirection.rtl,
        child: child!,
      ),
      home: const BrowserScreen(),
    );
  }
}
