# Trang Danh Sách Gói Đăng Ký (Subscription Plans)

## Giới thiệu
Component **SubscriptionPlans** hiển thị danh sách các gói đăng ký dịch vụ có sẵn cho công ty lựa chọn.

## Files đã tạo

### 1. Component
- **Path**: `/src/components/subscription/SubscriptionPlans.jsx`
- **Mô tả**: Component chính hiển thị danh sách gói dịch vụ

### 2. CSS
- **Path**: `/src/components/subscription/SubscriptionPlans.css`
- **Mô tả**: Styling cho component với thiết kế hiện đại

### 3. Page
- **Path**: `/src/pages/Subscription.jsx/SubscriptionPlansPage.jsx`
- **Mô tả**: Wrapper page cho component

## Tính năng

### Hiển thị thông tin gói:
✅ Tên gói (FREE, BASIC, PREMIUM, CUSTOM)
✅ Giá gói với định dạng tiền tệ VN
✅ Số lượng tin tuyển dụng
✅ Số lượt xem ứng viên
✅ Badge ưu tiên hiển thị
✅ Trạng thái gói (ACTIVE, PENDING_PAYMENT, etc.)
✅ Thông tin công ty (nếu có)
✅ Ngày bắt đầu và kết thúc
✅ Trạng thái hoạt động

### Tính năng đặc biệt:
- **Featured badge**: Gói PREMIUM được đánh dấu "Phổ biến nhất"
- **Progress tracking**: Hiển thị đã sử dụng bao nhiêu (currentJobCount, currentViewCount)
- **Comparison table**: Bảng so sánh các gói dịch vụ
- **Responsive design**: Tương thích mobile, tablet, desktop

## Cách sử dụng

### 1. Import trực tiếp component
\`\`\`jsx
import SubscriptionPlans from '../components/subscription/SubscriptionPlans';

function MyPage() {
  return <SubscriptionPlans />;
}
\`\`\`

### 2. Sử dụng Page wrapper
\`\`\`jsx
import SubscriptionPlansPage from '../pages/Subscription.jsx/SubscriptionPlansPage';

function App() {
  return <SubscriptionPlansPage />;
}
\`\`\`

### 3. Thêm vào routing (App.js hoặc routes file)
\`\`\`jsx
import SubscriptionPlansPage from './pages/Subscription.jsx/SubscriptionPlansPage';

// Trong routes
<Route path="/subscription/plans" element={<SubscriptionPlansPage />} />
\`\`\`

## API Requirements

Component sử dụng API service từ `subscriptionService.getlistSubscription()`:

### Expected Response Format:
\`\`\`json
{
  "result": [
    {
      "id": "string",
      "name": "FREE|BASIC|PREMIUM|CUSTOM",
      "jobLimit": 12,
      "candidateViewLimit": 120,
      "currentJobCount": 0,
      "currentViewCount": 0,
      "hasPriorityDisplay": true,
      "price": 80760.58,
      "status": "PENDING_PAYMENT|ACTIVE|EXPIRED|CANCELLED",
      "startDate": "2026-03-05T08:27:07",
      "endDate": "2026-04-04T08:27:07",
      "isActive": true,
      "createdAt": "2026-03-05T08:27:07",
      "company": {
        "id": "string",
        "name": "string",
        "imageUrl": "string",
        "status": "ACTIVE",
        ...
      }
    }
  ]
}
\`\`\`

## Dependencies
- `react`
- `sonner` (toast notifications)
- `lucide-react` (icons)
- `AuthContext` (authentication)

## Customization

### Thay đổi màu sắc gói:
Chỉnh sửa trong file CSS:
\`\`\`css
.plan-badge-large.plan-premium {
    background: linear-gradient(135deg, #your-color 0%, #your-color-2 100%);
    color: #your-text-color;
}
\`\`\`

### Thêm tính năng mới:
1. Thêm field mới vào `feature-item` trong JSX
2. Style trong CSS tương ứng

### Xử lý action "Đăng ký":
Hiện tại function `handleSubscribe()` chỉ hiển thị toast. Bạn có thể:
\`\`\`jsx
const handleSubscribe = (plan) => {
    // Chuyển đến trang thanh toán
    navigate(\`/payment?planId=\${plan.id}\`);
    
    // Hoặc mở modal
    setShowPaymentModal(true);
    setSelectedPlan(plan);
};
\`\`\`

## Screenshots/Preview
Component hiển thị:
- Card view với design gradient đẹp mắt
- Featured badge cho gói premium
- Progress indicators
- Comparison table responsive
- Hover effects và animations

## Support
Nếu cần hỗ trợ hoặc có lỗi, kiểm tra:
1. API endpoint `/subscription/list` đang hoạt động
2. Token authentication được truyền đúng
3. Response data structure đúng format

## Next Steps
- [ ] Kết nối với payment gateway
- [ ] Thêm filter/search gói
- [ ] Lưu gói yêu thích
- [ ] Tính năng so sánh chi tiết
- [ ] Export comparison table
