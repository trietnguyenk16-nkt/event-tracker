# Event Tracker

Next.js App Router + Supabase Postgres + Prisma + Resend + Vercel Cron.

## Local
`npm install` → sao chép `.env.example` thành `.env` → `npx prisma generate` → `npx prisma db push` → `npm run dev`.

## Supabase
Tạo project, lấy URI connection string ở Database Settings, đặt vào `DATABASE_URL`; dùng `DIRECT_URL` cho migration nếu có.

## Resend
Tạo API key, xác minh domain gửi, đặt `RESEND_API_KEY` và `EMAIL_FROM`.

## Vercel
Import repo, thêm toàn bộ env cho Production/Preview, build `npm run build`. Cấu hình cron gọi `/api/cron/reminders` mỗi 5 phút và bảo vệ bằng `CRON_SECRET`.

Không commit `.env`; không đưa secret vào client. Offline cache lưu danh sách gần nhất trong localStorage và service worker cache app shell.