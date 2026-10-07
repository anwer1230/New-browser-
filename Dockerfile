FROM node:22-slim

WORKDIR /app

# نسخ إعدادات npm وملف الحزم وتثبيت جميع الاعتماديات مع تجاوز تعارضات peer dependencies
COPY package.json .npmrc ./
RUN npm install --include=dev --legacy-peer-deps

# نسخ كامل ملفات المشروع
COPY . .

# بناء واجهة المتصفح الموحّد (Vite Production Build)
RUN npm run build

# إعداد بيئة التشغيل الإنتاجية لمنصة Render
ENV NODE_ENV=production
ENV PORT=10000

EXPOSE 10000

# تشغيل الخادم الموحّد (Express + Web Proxy + Groq Translation + Saved Pages DB)
CMD ["npm", "run", "start"]
