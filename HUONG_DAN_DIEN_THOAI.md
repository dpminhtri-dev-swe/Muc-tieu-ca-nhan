# Dùng Nhịp tiến trên điện thoại

## Phạm vi

Ứng dụng chạy miễn phí trên GitHub Pages hoặc Netlify. Dữ liệu được lưu trong trình duyệt của từng thiết bị; laptop và điện thoại không tự đồng bộ.

## Trước khi đưa lên hosting

Các file cần đưa lên gồm:

- `index.html`
- `styles.css`
- `app.js`
- `manifest.webmanifest`
- `sw.js`
- `icon.svg`

Không cần đưa các file test, kế hoạch hoặc thư mục `.playwright-cli` lên hosting.

## GitHub Pages

1. Tạo một repository mới trên GitHub, ví dụ `nhip-tien`.
2. Đưa các file ứng dụng vào repository.
3. Vào `Settings` → `Pages`.
4. Chọn `Deploy from a branch`.
5. Chọn branch `main`, thư mục `/root`, rồi bấm `Save`.
6. Chờ GitHub tạo đường link dạng `https://ten-tai-khoan.github.io/nhip-tien/`.

## Cài trên điện thoại

Mở đường link bằng Chrome/Edge/Safari, sau đó chọn `Thêm vào màn hình chính` hoặc `Add to Home Screen`.

## Sao lưu dữ liệu

Vì mỗi thiết bị có dữ liệu riêng, dùng `Xuất dữ liệu` trên laptop để tải JSON, sau đó mở app trên điện thoại và chọn `Nhập dữ liệu`.
