import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default [
  {
    ignores: ['dist/**/*', 'node_modules/**/*', 'hybrid-ai/**/*', 'hybrid_ai_app/**/*']
  },
  firebaseRulesPlugin.configs['flat/recommended']
];
