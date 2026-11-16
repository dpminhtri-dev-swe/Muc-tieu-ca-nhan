# Goal Tracker Web Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Xây web app local miễn phí để tạo, theo dõi và sao lưu mục tiêu cá nhân.

**Architecture:** Ứng dụng tĩnh gồm `index.html`, `styles.css` và `app.js`. JavaScript quản lý state trong trình duyệt bằng `localStorage`; không có backend hoặc dependency bên ngoài.

**Tech Stack:** HTML5, CSS3, Vanilla JavaScript, `localStorage`, JSON import/export.

**Spec:** `docs/superpowers/specs/2026-11-16-goal-tracker-design.md`

## Global Constraints

- Chạy được bằng cách mở `index.html`, không cần cài thư viện.
- Giao diện tiếng Việt, ưu tiên laptop và responsive cơ bản.
- Dữ liệu không rời khỏi máy; không gọi API bên ngoài.
- Có dữ liệu mẫu tối thiểu hoặc trạng thái trống rõ ràng khi mới mở.
- File nhập JSON phải được kiểm tra cấu trúc trước khi ghi đè dữ liệu hiện tại.

## Review Focus

- localStorage hỏng hoặc dữ liệu cũ sai cấu trúc — app phải tự quay về state rỗng an toàn.
- Mục tiêu không có bước — tiến độ phải hiển thị hợp lý.
- Hạn hoàn thành đã qua — phải được đánh dấu quá hạn nhưng mục tiêu hoàn thành không bị coi là quá hạn.
- Import file JSON không hợp lệ — không được xóa dữ liệu hiện tại.
- Xóa mục tiêu — phải có xác nhận trước khi xóa.

### Task 1: Tạo khung ứng dụng

**Files:**
- Create: `index.html`
- Create: `styles.css`
- Create: `app.js`

- [ ] Tạo layout gồm header, dashboard, form mục tiêu, danh sách mục tiêu và khu vực sao lưu.
- [ ] Thêm các phần tử có id ổn định cho JavaScript: `goal-form`, `goal-list`, `empty-state`, `filter-status`, `filter-type`, `export-data`, `import-data`.
- [ ] Tạo giao diện responsive cơ bản.
- [ ] Mở `index.html` và xác nhận không có lỗi tải tài nguyên.

### Task 2: State và lưu trữ cục bộ

**Files:**
- Modify: `app.js`

- [ ] Định nghĩa state mục tiêu gồm id, title, description, type, dueDate, priority, status, steps, createdAt, updatedAt.
- [ ] Viết hàm `loadState()` đọc `localStorage` và fallback về state rỗng nếu JSON lỗi.
- [ ] Viết hàm `saveState()` lưu state sau mỗi thay đổi.
- [ ] Tạo hàm tính tiến độ từ số bước hoàn thành; mục tiêu không có bước có tiến độ 0%.
- [ ] Kiểm tra bằng cách reload trang và xác nhận dữ liệu vẫn còn.

### Task 3: Tạo và hiển thị mục tiêu

**Files:**
- Modify: `index.html`
- Modify: `app.js`
- Modify: `styles.css`

- [ ] Xử lý form thêm mục tiêu với loại ngắn hạn/dài hạn, ưu tiên và hạn hoàn thành.
- [ ] Hiển thị thẻ mục tiêu với tiến độ, số bước, hạn và trạng thái.
- [ ] Cho phép sửa mục tiêu.
- [ ] Cho phép đánh dấu hoàn thành mục tiêu.
- [ ] Hiển thị trạng thái quá hạn khi ngày hiện tại vượt hạn và mục tiêu chưa hoàn thành.
- [ ] Thêm xác nhận trước khi xóa.

### Task 4: Bước nhỏ và bộ lọc

**Files:**
- Modify: `index.html`
- Modify: `app.js`
- Modify: `styles.css`

- [ ] Cho phép thêm, sửa tên và xóa bước nhỏ trong chi tiết mục tiêu.
- [ ] Đánh dấu hoàn thành từng bước và cập nhật tiến độ ngay.
- [ ] Lọc theo trạng thái, loại mục tiêu và ưu tiên.
- [ ] Tạo khu vực “Hôm nay” gồm mục tiêu gần hạn hoặc có bước chưa hoàn thành.
- [ ] Hiển thị trạng thái trống khi không có kết quả.

### Task 5: Sao lưu và khôi phục

**Files:**
- Modify: `index.html`
- Modify: `app.js`

- [ ] Nút xuất toàn bộ state thành file JSON có ngày tạo file.
- [ ] Nút nhập JSON từ file cục bộ.
- [ ] Kiểm tra JSON trước khi thay thế state hiện tại.
- [ ] Nếu file sai, hiển thị lỗi và giữ nguyên dữ liệu hiện tại.
- [ ] Xác nhận trước khi ghi đè dữ liệu hiện tại bằng file nhập.

### Task 6: Kiểm tra hoàn thiện

**Files:**
- Modify: `index.html`, `styles.css`, `app.js` khi cần.

- [ ] Kiểm tra tạo mục tiêu ngắn hạn và dài hạn.
- [ ] Kiểm tra mục tiêu không có bước.
- [ ] Kiểm tra mục tiêu quá hạn và mục tiêu đã hoàn thành.
- [ ] Kiểm tra reload trình duyệt.
- [ ] Kiểm tra import file lỗi và file hợp lệ.
- [ ] Kiểm tra màn hình hẹp.
- [ ] Kiểm tra JavaScript không có lỗi trong console.
