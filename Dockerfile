FROM node:22-slim

WORKDIR /app

# نسخ ملفات الحزم وتثبيت جميع الاعتماديات (بما فيها أدوات البناء)
COPY package.json ./
RUN npm install --include=dev

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
