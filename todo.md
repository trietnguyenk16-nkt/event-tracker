# Checklist implement OpenAI AI features

- [x] Đọc hướng dẫn tích hợp AI và cập nhật issue/backlog.
- [x] Thêm OpenAI server client và danh sách model an toàn.
- [x] Thêm dropdown chọn model, không expose API key phía client.
- [x] Implement quick capture, daily agenda, conflict suggestions và semantic search MVP.
- [x] Thêm fallback khi thiếu key, validation structured output và test.
- [x] Cập nhật README/env, issue, commit/push và hướng dẫn Vercel.

## Next high-priority issues

- [x] #26 PWA/mobile: hoàn thiện iPhone 16 Pro safe-area, install metadata, offline read-only state và mobile verification.
- [x] #27 Regression: thêm route contract tests, PWA smoke checklist và CI verification command/documentation.
- [x] #28 Quick Capture: bổ sung preview có thể xác nhận trước khi tạo event, validation ambiguity và fallback form thủ công.

## Duration, history and timezone/recurrence

- [x] #17 Duration: thêm duration unit/value, preview ngày sinh, idempotency và liên kết event gốc.
- [x] #10 Event History: lưu audit record theo transaction, API history và panel mobile.
- [x] #13 Timezone/recurrence: lưu IANA timezone, recurrence rule và tạo occurrence an toàn theo UTC.

## Rate limit, export/import and production smoke test

- [x] Chuẩn bị checklist chạy migration Supabase và smoke test Vercel/Resend/OpenAI sau deploy.
- [x] #15 Rate Limit: thêm giới hạn request server-side, response 429 và test reset/window behavior.
- [x] #14 Export/Import: thêm export JSON/CSV, import có validate/preview và chống duplicate cơ bản.

## Next high-priority backlog

- [x] Rà soát issue còn mở và chọn 2–3 hạng mục có giá trị cao nhất sau #14/#15: #7 Quality, #11 Email Reminder Testing và #9 UX.
- [x] Implement #7 Quality, #11 Email Reminder Testing và #9 UX, gồm backend, UI và tests tương ứng. Email thật vẫn cần manual smoke test sau khi có Resend credentials.
- [x] Chạy verify, cập nhật GitHub, commit/push và lưu checkpoint cho nhóm issue mới.

## Continued high-value backlog

- [x] Rà soát issue còn mở sau nhóm #7/#9/#14/#15 và chọn 2–3 feature tiếp theo: #18 Calendar Views, #8 Deployment và #25 Supabase workflow.
- [x] Implement #18 Calendar Views, #8 Deployment và #25 Supabase workflow cùng tests và UI/API tương ứng. Database production thật vẫn cần smoke test bằng credentials của người dùng.
- [x] Chạy verify, cập nhật GitHub, push code và lưu checkpoint mới cho nhóm #18/#8/#25.

## AI text response display

- [x] Thay JSON thô trong AI Assistant bằng câu trả lời tiếng Việt dạng text có tiêu đề, đoạn văn và danh sách dễ đọc.
- [x] Giữ structured payload nội bộ cho Quick Capture draft và các thao tác event; không làm mất model/configured/error state.
- [x] Thêm unit tests cho text formatter và chạy verify trước khi push.
