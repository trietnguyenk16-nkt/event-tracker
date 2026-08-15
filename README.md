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

## Regression và PWA smoke checklist

Trước mỗi production deploy, chạy `pnpm run verify`. Lệnh này chạy toàn bộ Vitest, TypeScript, production dependency audit và Next.js production build; không gọi Resend thật và không ghi vào production database.

Checklist thủ công gồm: tạo/sửa/hoàn tất/xóa event; lọc date/tag/status và phân trang; kiểm tra cron bằng `CRON_SECRET`; xác nhận email Resend ở môi trường test; mở `/manifest.json`; kiểm tra service worker không intercept request mutation hoặc API; tải app một lần rồi chuyển offline để đọc dữ liệu cache; kiểm tra viewport 393x852, bàn phím mobile và vùng safe-area. Cần xác nhận thêm trên iPhone Safari thật vì sandbox không thay thế thiết bị iOS.

Quick Capture AI hiện tạo **bản nháp chưa lưu**. Người dùng phải xem preview, xử lý cảnh báo thiếu ngày/giờ, bấm “Xác nhận và chỉnh sửa”, rồi mới bấm “Lưu sự kiện” trong form. Khi AI lỗi hoặc chưa có key, form thủ công vẫn là fallback.

## Duration, Event History và Timezone/Recurrence

Migration `prisma/migrations/20260814_duration_history_timezone/migration.sql` bổ sung các cột timezone, duration, recurrence, soft-delete, idempotency và bảng `EventHistory`. Với Supabase production, dùng `DIRECT_URL` để chạy migration từ môi trường có Prisma hoặc mở SQL Editor và chạy file migration; không dùng `db push` tùy tiện trên dữ liệu thật. Sau migration, chạy `pnpm exec prisma generate` và redeploy Vercel.

Form event lưu timestamp dưới dạng UTC và lưu timezone IANA riêng, mặc định `Asia/Ho_Chi_Minh`. Duration hỗ trợ ngày, tuần, tháng và năm; khi bật tạo duration, app preview ngày mới và backend tạo event liên kết với event gốc trong transaction. `idempotency_key` ngăn retry tạo bản sao cùng request.

Recurrence hỗ trợ daily, weekly và monthly với số lần hoặc ngày kết thúc, tối đa 60 occurrence. Mỗi occurrence là một event độc lập liên kết về root series; PATCH/DELETE mặc định áp dụng cho một occurrence, còn `scope=series` áp dụng cho cả series. Reminder tiếp tục so sánh instant UTC và loại trừ event đã soft-delete.

Mỗi create/update/complete/reopen/delete ghi vào `EventHistory`; đọc qua `GET /api/events/:id/history`. History được hiển thị từ nút “Xem lịch sử” trong danh sách event và được giữ lại khi event bị xóa mềm.

## Quy trình migration và smoke test production

Sau khi pull commit mới, chạy file `prisma/migrations/20260814_duration_history_timezone/migration.sql` trong Supabase SQL Editor hoặc chạy `DIRECT_URL=... pnpm exec prisma migrate deploy` từ môi trường có Prisma. Kiểm tra các cột `timezone`, `duration_value`, `recurrence_rule`, `deleted_at`, `idempotency_key` và bảng `EventHistory` xuất hiện trước khi redeploy Vercel. Không chạy destructive SQL trên database production.

Trong Vercel, xác nhận `DATABASE_URL`, `DIRECT_URL`, `CRON_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, `OPENAI_API_KEY` và `OPENAI_MODEL` thuộc đúng Production Environment, sau đó bấm **Redeploy**. Smoke test lần lượt `GET /api/health`, tạo event có idempotency key, thử duration/recurrence, mở history, export JSON/CSV, import file hợp lệ và file có lỗi. Gọi cron với `Authorization: Bearer <CRON_SECRET>` trong môi trường test; không commit secret vào repository.

Rate limit hiện là best-effort in-memory theo IP trong từng serverless instance: mutation event 30 request/phút, import 10 request/phút và export 20 request/phút; khi vượt ngưỡng API trả `429`, `Retry-After` và `X-Request-ID`. Nếu traffic production chạy nhiều instance và cần giới hạn toàn cục, thay storage in-memory bằng Redis/Upstash trước khi mở public access rộng.

Export không chứa API key, cron secret, history nội bộ hoặc metadata hệ thống. Import hỗ trợ JSON/CSV, preview trước khi ghi, báo lỗi theo dòng và skip duplicate dựa trên idempotency key hoặc title + instant UTC + timezone.

## Checklist triển khai Vercel và Supabase

| Giai đoạn | Việc cần làm | Kết quả cần kiểm tra |
|---|---|---|
| Supabase | Tạo project Postgres, lấy pooled `DATABASE_URL` và direct `DIRECT_URL` | Không commit password hoặc service key |
| Migration | Chạy `prisma/migrations/20260814_duration_history_timezone/migration.sql` trong SQL Editor hoặc `DIRECT_URL=... pnpm exec prisma migrate deploy` | Có bảng `Event`, `EventHistory`, index thời gian/trạng thái và các cột recurrence |
| Vercel | Import repository `trietnguyenk16-nkt/event-tracker`, chọn Next.js và thêm env Production | Build không chứa secret phía client |
| Resend/Cron | Thêm `RESEND_API_KEY`, `EMAIL_FROM`, `CRON_SECRET`; kiểm tra Vercel Cron | `GET /api/health` trả `status: ok`, cron sai secret trả 401 |
| Rollback | Trước migration lớn, export JSON/CSV và lưu checkpoint/deployment ổn định | Có bản backup và version có thể quay lại |

Nếu migration thất bại, không chạy lại bằng `db push` trên Production. Kiểm tra lỗi SQL, khôi phục deployment code trước đó nếu cần, rồi xác nhận schema bằng Prisma/Supabase trước khi tiếp tục. Với thay đổi schema phá vỡ tương thích, dùng quy trình expand–migrate–contract thay vì xóa cột trực tiếp.
