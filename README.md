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


## API filter

`GET /api/events` hỗ trợ lọc phía server và phân trang:

- `date=YYYY-MM-DD` lọc theo ngày UTC.
- `tag=planning` lọc event có tag tương ứng.
- `status=all|completed|pending` lọc trạng thái.
- `page=1&limit=50` phân trang, giới hạn tối đa 100 bản ghi mỗi trang.

Ví dụ: `GET /api/events?date=2026-08-20&tag=planning&status=pending&page=1&limit=20`.

Response trả về `data`, `pagination` gồm `page`, `limit`, `total`, `totalPages` và `filters` đã áp dụng.

## AI với OpenAI

Ứng dụng có AI workspace gồm quick capture tiếng Việt, agenda 7 ngày, phát hiện conflict và hỏi lịch. Tất cả request OpenAI chạy server-side; trình duyệt chỉ nhận kết quả, không nhận `OPENAI_API_KEY`.

Trên Vercel, thêm:

```text
OPENAI_API_KEY=re_hoac_openai_key_cua_ban
OPENAI_MODEL=gpt-4o-mini
```

`OPENAI_MODEL` có thể chọn một trong các model được allowlist: `gpt-4o-mini`, `gpt-4.1-mini` hoặc `gpt-4.1`. Người dùng cũng có thể chọn model trong dropdown trên app; server vẫn validate lại model. Khi chưa có key, app hiển thị fallback deterministic và không gọi provider.

Các endpoint AI là `/api/ai/models`, `/api/ai/quick-capture`, `/api/ai/agenda`, `/api/ai/conflicts` và `/api/ai/search`. AI chỉ tạo đề xuất; việc ghi/sửa event hoặc gửi email vẫn cần người dùng xác nhận. Không commit API key và không đưa key vào biến có tiền tố `NEXT_PUBLIC_`.

## Lưu ý OpenAI

Hãy tạo API key tại OpenAI Platform và đặt trong **Vercel → Project Settings → Environment Variables** cho Production/Preview. Sau khi thêm hoặc đổi key, cần redeploy. Nên đặt hạn mức chi phí ở OpenAI Platform và theo dõi usage; app đã giới hạn model allowlist, input quick capture 4.000 ký tự, search 1.000 ký tự và timeout provider 15 giây.
