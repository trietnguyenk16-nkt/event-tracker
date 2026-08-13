# Ý tưởng thiết kế Event Tracker

## Hướng 1: Paper Ledger
**Giới thiệu:** Giao diện như một cuốn sổ lịch hiện đại: nền giấy ngà, chữ serif có cá tính và các dấu coral làm mốc thị giác. Cảm giác bình tĩnh, hữu dụng và có chủ đích.

**Xác suất:** 0.07

## Hướng 2: Quiet Utility
**Giới thiệu:** Một công cụ tối giản, nhiều khoảng thở, tương phản cao và tập trung tuyệt đối vào thao tác nhanh. Màu sắc trung tính, nhấn nhẹ để không cạnh tranh với lịch.

**Xác suất:** 0.03

## Hướng 3: Night Pulse
**Giới thiệu:** Bảng điều khiển tối với các điểm sáng màu hổ phách, dành cho người thích quản lý lịch vào buổi tối. Nhịp chuyển động nhanh và phản hồi rõ ràng.

**Xác suất:** 0.09

## Hướng được chọn: Paper Ledger

### Design Movement
Editorial stationery / modern paper planner.

### Core Principles
Giao diện phải tạo cảm giác hữu hình như giấy; typography dẫn dắt thứ bậc thông tin; coral chỉ dùng cho hành động và thời điểm; bố cục ưu tiên dòng đọc tự nhiên thay vì các thẻ đồng đều.

### Color Philosophy
Nền ivory giúp lịch dễ đọc lâu trên mobile, navy tạo độ tin cậy và coral là tín hiệu về thời gian cần chú ý. Dark mode chuyển sang ink blue thay vì đen tuyệt đối để giữ cảm giác giấy trong không gian tối.

### Layout Paradigm
Một cột nội dung chính cho dòng sự kiện và một rail tổng quan bên phải trên desktop; mobile chuyển thành dòng dọc với form dạng modal để thao tác bằng một tay.

### Signature Elements
Logo lịch kết hợp dấu check; nhãn tag dạng viên giấy sage; tiêu đề serif lớn như headline trên trang nhật ký.

### Interaction Philosophy
Mỗi thao tác phải có phản hồi ngắn, rõ và không gây nhiễu. Hover nâng nhẹ; nút chính phản hồi bằng chuyển động nhỏ; thao tác bàn phím và reduced-motion vẫn tức thì.

### Animation
Entrance stagger 40ms cho các dòng sự kiện; transition dưới 300ms; chỉ animate opacity/transform; modal xuất hiện từ scale 0.97 và opacity 0; tôn trọng prefers-reduced-motion.

### Typography System
Tiêu đề dùng Georgia để tạo chất editorial; nội dung và điều khiển dùng Arial nhằm giữ khả năng đọc trên mobile. Headline dùng cỡ lớn, line-height chặt; metadata dùng uppercase tracking rộng.

### Brand Essence
Một lịch sự kiện nhẹ và riêng tư cho người muốn nhìn thấy thời gian rõ hơn, với trải nghiệm gần gũi như sổ tay nhưng tốc độ của web. Tính cách: điềm tĩnh, rõ ràng, đáng tin.

### Brand Voice
Headline ngắn, cụ thể và có nhịp. CTA nói thẳng hành động, không dùng filler.

> “Đừng để điều quan trọng trôi qua.”

> “Thêm một mốc để giữ nhịp cho ngày của bạn.”

### Wordmark & Logo
Biểu tượng lịch hình học có thanh coral ở phần đầu và dấu check chuyển động hướng về phía trước; wordmark đi cùng dùng serif đậm, không dùng chữ mặc định cho biểu tượng.

### Signature Brand Color
Coral `#e66f51`, dùng cho mốc thời gian, CTA và trạng thái cần chú ý.

## Style Decisions
- Không dùng layout trung tâm toàn trang; desktop dùng rail tổng quan bất đối xứng.
- Không dùng gradient tím hoặc các card bo tròn đồng nhất quá mức.
- Ưu tiên nền ivory/ink blue và coral làm điểm nhấn có mục đích.
