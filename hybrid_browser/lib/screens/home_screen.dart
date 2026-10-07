import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../widgets/animated_background.dart';
import '../widgets/vpn_indicator.dart';
import '../widgets/quick_action_card.dart';
import '../widgets/search_bar_widget.dart';
import '../widgets/recent_item.dart';
import 'browser_screen.dart';
import 'media_search_screen.dart';
import 'downloads_screen.dart';
import 'vpn_status_screen.dart';
import 'settings_screen.dart';

class HomeScreen extends StatefulWidget {
  final String serverUrl;
  const HomeScreen({super.key, required this.serverUrl});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen>
    with SingleTickerProviderStateMixin {
  final _searchController = TextEditingController();
  final _scrollController = ScrollController();
  bool _vpnActive = false;
  String? _vpnLocation;

  late AnimationController _fadeController;
  late Animation<double> _fadeAnimation;

  // أمثلة سريعة
  final List<Map<String, dynamic>> _recentItems = [
    {
      'icon': Icons.movie_outlined,
      'title': 'Interstellar (2014)',
      'subtitle': 'مُترجم • 2h 49m',
      'color': AppTheme.primary,
    },
    {
      'icon': Icons.play_circle_outline,
      'title': 'The Last of Us - S01E01',
      'subtitle': 'مُترجم • 81m',
      'color': AppTheme.accent,
    },
    {
      'icon': Icons.language,
      'title': 'youtube.com/watch?v=...',
      'subtitle': 'زيارة سابقة • قبل 3 ساعات',
      'color': AppTheme.secondary,
    },
  ];

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _fadeAnimation = CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeOut,
    );
    _fadeController.forward();
    _checkVpnStatus();
  }

  Future<void> _checkVpnStatus() async {
    // في التطبيق الحقيقي: افحص WireGuard
    await Future.delayed(const Duration(milliseconds: 500));
    if (mounted) {
      setState(() {
        _vpnActive = true;
        _vpnLocation = 'السعودية';
      });
    }
  }

  void _onSearch() {
    final query = _searchController.text.trim();
    if (query.isEmpty) return;

    // افتح المتصفح مع البحث
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => BrowserScreen(
          initialUrl: query.contains('.') && !query.contains(' ')
              ? 'https://$query'
              : 'https://www.google.com/search?q=${Uri.encodeComponent(query)}',
        ),
      ),
    );
  }

  void _openBrowser() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => const BrowserScreen(),
      ),
    );
  }

  void _openMediaSearch() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => const MediaSearchScreen(),
      ),
    );
  }

  void _openDownloads() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => const DownloadsScreen(),
      ),
    );
  }

  void _openVpn() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => const VpnStatusScreen(),
      ),
    );
  }

  void _openSettings() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => SettingsScreen(serverUrl: widget.serverUrl),
      ),
    );
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    _fadeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: AnimatedBackground(
        child: SafeArea(
          child: FadeTransition(
            opacity: _fadeAnimation,
            child: CustomScrollView(
              controller: _scrollController,
              physics: const BouncingScrollPhysics(),
              slivers: [
                // ═══ الشريط العلوي ═══
                SliverToBoxAdapter(child: _buildTopBar()),

                // ═══ الترحيب ═══
                SliverToBoxAdapter(child: _buildGreeting()),

                // ═══ شريط البحث ═══
                SliverToBoxAdapter(child: _buildSearchBar()),

                // ═══ الأزرار السريعة ═══
                SliverToBoxAdapter(child: _buildQuickActions()),

                // ═══ عنوان "الأحدث" ═══
                SliverToBoxAdapter(child: _buildSectionHeader()),

                // ═══ قائمة الأحدث ═══
                SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, i) {
                        final item = _recentItems[i];
                        return RecentItem(
                          icon: item['icon'],
                          title: item['title'],
                          subtitle: item['subtitle'],
                          color: item['color'],
                          onTap: _openMediaSearch,
                          onDelete: () {
                            setState(() => _recentItems.removeAt(i));
                          },
                        );
                      },
                      childCount: _recentItems.length,
                    ),
                  ),
                ),

                // ═══ مساحة سفلية ═══
                const SliverToBoxAdapter(child: SizedBox(height: 40)),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════
  // الشريط العلوي
  // ═══════════════════════════════════════════════════════════
  Widget _buildTopBar() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 4),
      child: Row(
        children: [
          // الأيقونة/الشعار
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              gradient: AppTheme.gradientPrimary,
              borderRadius: BorderRadius.circular(14),
              boxShadow: [
                BoxShadow(
                  color: AppTheme.primary.withOpacity(0.4),
                  blurRadius: 12,
                ),
              ],
            ),
            child: const Icon(
              Icons.travel_explore_rounded,
              color: Colors.white,
              size: 24,
            ),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Hybrid Browser',
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary,
                  ),
                ),
                Text(
                  'متصفح ذكي مع ترجمة فورية',
                  style: TextStyle(
                    fontSize: 11,
                    color: AppTheme.textMuted,
                  ),
                ),
              ],
            ),
          ),
          // زر الإعدادات
          Container(
            decoration: BoxDecoration(
              color: AppTheme.bgCard,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.border),
            ),
            child: IconButton(
              icon: const Icon(Icons.settings_outlined,
                  color: AppTheme.textSecondary, size: 20),
              onPressed: _openSettings,
              splashRadius: 22,
            ),
          ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════
  // الترحيب + VPN
  // ═══════════════════════════════════════════════════════════
  Widget _buildGreeting() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 12),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _greeting(),
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'كيف يمكنني مساعدتك اليوم؟',
                  style: TextStyle(
                    fontSize: 13,
                    color: AppTheme.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          VpnIndicator(
            active: _vpnActive,
            location: _vpnLocation,
            onTap: _openVpn,
          ),
        ],
      ),
    );
  }

  String _greeting() {
    final h = DateTime.now().hour;
    if (h < 12) return 'صباح الخير ☀️';
    if (h < 18) return 'مساء الخير 🌤️';
    return 'مساء النور 🌙';
  }

  // ═══════════════════════════════════════════════════════════
  // شريط البحث
  // ═══════════════════════════════════════════════════════════
  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
      child: SearchBarWidget(
        controller: _searchController,
        onSearch: _onSearch,
        onVoice: () {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('🎙️ البحث الصوتي قريبًا')),
          );
        },
        onScan: () {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('📷 مسح QR قريبًا')),
          );
        },
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════
  // الأزرار السريعة
  // ═══════════════════════════════════════════════════════════
  Widget _buildQuickActions() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: GridView.count(
        crossAxisCount: 2,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 1.15,
        children: [
          QuickActionCard(
            icon: Icons.public_rounded,
            title: 'متصفح الويب',
            subtitle: 'تصفح أي موقع',
            gradient: AppTheme.gradientPrimary,
            onTap: _openBrowser,
          ),
          QuickActionCard(
            icon: Icons.movie_filter_rounded,
            title: 'بحث الوسائط',
            subtitle: 'فيلم • فيديو • ترجمة',
            gradient: AppTheme.gradientAccent,
            onTap: _openMediaSearch,
          ),
          QuickActionCard(
            icon: Icons.download_done_rounded,
            title: 'التحميلات',
            subtitle: 'الملفات المحفوظة',
            gradient: AppTheme.gradientSuccess,
            onTap: _openDownloads,
          ),
          QuickActionCard(
            icon: Icons.shield_moon_rounded,
            title: 'الحماية VPN',
            subtitle: _vpnActive ? 'متصل • $_vpnLocation' : 'غير مفعّل',
            gradient: LinearGradient(
              colors: _vpnActive
                  ? [AppTheme.success, AppTheme.accent]
                  : [AppTheme.danger, AppTheme.secondary],
            ),
            onTap: _openVpn,
          ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════
  // عنوان القسم
  // ═══════════════════════════════════════════════════════════
  Widget _buildSectionHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 28, 20, 12),
      child: Row(
        children: [
          const Text(
            'الأحدث',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: AppTheme.primary.withOpacity(0.15),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              '${_recentItems.length}',
              style: const TextStyle(
                color: AppTheme.primary,
                fontSize: 11,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const Spacer(),
          TextButton(
            onPressed: _openMediaSearch,
            child: const Row(
              children: [
                Text(
                  'عرض الكل',
                  style: TextStyle(color: AppTheme.textSecondary, fontSize: 12),
                ),
                SizedBox(width: 4),
                Icon(Icons.arrow_forward_ios_rounded,
                    size: 12, color: AppTheme.textSecondary),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
