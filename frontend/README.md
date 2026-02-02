
# SkillBridge — Frontend

Giao diện người dùng cho dự án SkillBridge, xây dựng bằng React. Bao gồm các trang cho người quản trị, nhà tuyển dụng, ứng viên và chức năng xác thực.

**Stack chính**: React, React Router, Context / Redux (store), JavaScript, CSS.

**Thư mục chính**:
- `src/` — mã nguồn ứng dụng
	- `components/` — các component theo chức năng
	- `config/` — cấu hình API và môi trường
	- `context/` — React context (Auth, User, Company...)
	- `hooks/` — custom hooks
	- `pages/` — các trang (routes)
	- `services/` — gọi API, logic phía client
	- `store/` — Redux store, actions, reducers

## Khởi động nhanh

Yêu cầu: Node.js (14+) và npm hoặc yarn

1. Cài dependencies

```bash
npm install
```

2. Chạy môi trường phát triển

```bash
npm start
```

Truy cập: http://localhost:3000

3. Build để deploy

```bash
npm run build
```

Build sẽ tạo thư mục `build/` chứa tệp tĩnh để đưa lên server hoặc dịch vụ hosting (Netlify, Vercel, GitHub Pages, v.v.).

4. Chạy test (nếu có)

```bash
npm test
```

## Cấu hình môi trường

- API base URL và các flag cấu hình nằm trong `src/config/` (`environment.js`, `api.config.js`, `featureFlags.js`).
- Thay đổi cấu hình trước khi build cho môi trường production/staging.

## Triển khai

- Upload nội dung `build/` lên static host hoặc cấu hình CI/CD để build và deploy tự động.

## Góp ý & Phát triển

- Tạo branch mới cho tính năng hoặc fix: `git checkout -b feat/your-feature`
- Commit thay đổi rõ ràng, push và tạo Pull Request.

Nếu cần giúp cấu hình backend hoặc môi trường, cho tôi biết để hướng dẫn chi tiết.

---
Vietnamese README created by the project maintainer. For detailed docs, check `src/` folder and the app code.
This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
