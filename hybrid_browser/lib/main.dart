import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'theme/app_theme.dart';
import 'screens/home_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
    systemNavigationBarColor: AppTheme.bgDark,
    systemNavigationBarIconBrightness: Brightness.light,
  ));
  runApp(const HybridBrowserApp());
}

class HybridBrowserApp extends StatelessWidget {
  const HybridBrowserApp({super.key});

  // ⚠️ غيّر هذا إلى IP الخاص بخادمك على Oracle Cloud
  static const serverUrl = 'http://129.151.142.88:8500';

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Hybrid Browser',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.dark,
      locale: const Locale('ar'),
      builder: (context, child) => Directionality(
        textDirection: TextDirection.rtl,
        child: child!,
      ),
      home: const HomeScreen(serverUrl: serverUrl),
    );
  }
}
