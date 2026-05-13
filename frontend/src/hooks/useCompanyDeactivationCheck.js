import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useEffect } from 'react';

/**
 * Hook để kiểm tra và bảo vệ các trang khi công ty bị vô hiệu hóa
 * @param {Array<string>} allowedPathsWhenDeactivated - Danh sách các đường dẫn được phép truy cập khi công ty bị vô hiệu hóa
 * @example
 * // Cho phép truy cập cài đặt khi công ty bị vô hiệu hóa
 * useCompanyDeactivationCheck(['/recruiter/settings']);
 */
export const useCompanyDeactivationCheck = (allowedPathsWhenDeactivated = []) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const isCompanyDeactivated = user?.companyStatus === 'DEACTIVATED';

    useEffect(() => {
        if (isCompanyDeactivated) {
            // Kiểm tra xem trang hiện tại có được phép truy cập không
            const currentPath = window.location.pathname;
            const isAllowed = allowedPathsWhenDeactivated.some(path => 
                currentPath.startsWith(path) || currentPath === path
            );

            if (!isAllowed) {
                toast.error('Công ty của bạn đã bị vô hiệu hóa', {
                    id: 'deactivated-company-toast',
                    description: 'Bạn không thể truy cập trang này. Vui lòng liên hệ admin.'
                });
                // Chuyển hướng tới trang cài đặt (luôn có thể truy cập)
                navigate('/recruiter/settings');
            }
        }
    }, [isCompanyDeactivated, navigate, allowedPathsWhenDeactivated]);

    return {
        isCompanyDeactivated,
        canAccess: (path) => {
            if (!isCompanyDeactivated) return true;
            return allowedPathsWhenDeactivated.some(p => 
                path.startsWith(p) || path === p
            );
        }
    };
};

export default useCompanyDeactivationCheck;
