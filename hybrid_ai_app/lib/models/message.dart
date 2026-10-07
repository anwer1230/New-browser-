enum MessageRole { user, assistant, system }

class Message {
  final String id;
  final String content;
  final MessageRole role;
  final DateTime timestamp;
  final List<String>? experts;
  final double? elapsed;

  Message({
    required this.id,
    required this.content,
    required this.role,
    DateTime? timestamp,
    this.experts,
    this.elapsed,
  }) : timestamp = timestamp ?? DateTime.now();

  Map<String, dynamic> toJson() => {
        'id': id,
        'content': content,
        'role': role.name,
        'timestamp': timestamp.toIso8601String(),
        'experts': experts,
        'elapsed': elapsed,
      };

  factory Message.fromJson(Map<String, dynamic> json) => Message(
        id: json['id'],
        content: json['content'],
        role: MessageRole.values.firstWhere((e) => e.name == json['role']),
        timestamp: DateTime.parse(json['timestamp']),
        experts: json['experts'] != null
            ? List<String>.from(json['experts'])
            : null,
        elapsed: json['elapsed']?.toDouble(),
      );
}
