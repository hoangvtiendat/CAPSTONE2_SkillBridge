/**
 * Mock data for homepage carousel banners
 * Sau này sẽ thay bằng API calls
 */

export const bannersMockData = [
  {
    id: 1,
    title: 'Tìm Công Việc Phù Hợp',
    subtitle: 'Khám phá hàng nghìn cơ hội nghề nghiệp tuyệt vời',
    description: 'Tìm kiếm bằng ngôn ngữ tự nhiên với AI semantic search',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop',
    cta: {
      text: 'Xem Việc Làm',
      url: '/job-search'
    },
    bgColor: '#667eea'
  },
  {
    id: 2,
    title: 'AI CV Parsing',
    subtitle: 'Upload CV, AI tự động phân tích',
    description: 'Hệ thống tự động trích xuất thông tin từ CV của bạn vào hồ sơ online',
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop',
    cta: {
      text: 'Upload CV',
      url: '/signup'
    },
    bgColor: '#764ba2'
  },
  {
    id: 3,
    title: 'Smart Scoring',
    subtitle: 'Chấm điểm tự động độ phù hợp',
    description: 'Hệ thống AI so sánh CV của bạn với JD và cho điểm phù hợp',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop',
    cta: {
      text: 'Tìm Hiểu Thêm',
      url: '/job-search'
    },
    bgColor: '#f093fb'
  },
  {
    id: 4,
    title: 'Dành Cho Nhà Tuyển Dụng',
    subtitle: 'Tìm nhân tài phù hợp một cách nhanh chóng',
    description: 'Đăng tin tuyển dụng, hệ thống tự động xếp hạng ứng viên',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop',
    cta: {
      text: 'Đăng Tin Tuyển Dụng',
      url: '/signup?role=recruiter'
    },
    bgColor: '#4facfe'
  }
];
