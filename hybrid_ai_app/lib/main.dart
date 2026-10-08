import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/chat_provider.dart';
import 'screens/home_screen.dart';
import 'theme/app_theme.dart';

void main() {
  runApp(const HybridAIApp());
}

class HybridAIApp extends StatelessWidget {
  const HybridAIApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ChatProvider()..init()),
      ],
      child: MaterialApp(
        title: 'Hybrid AI',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light,
        darkTheme: AppTheme.dark,
        themeMode: ThemeMode.system,
        home: const HomeScreen(),
        locale: const Locale('ar', 'SA'),
      ),
    );
  }
}
