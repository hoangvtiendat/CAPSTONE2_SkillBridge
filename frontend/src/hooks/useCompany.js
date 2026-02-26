import { useState } from 'react';
import companyService from '../services/api/companyService';

export const useCompany = () => {
    const [loading, setLoading] = useState(false);

    const checkTaxCode = async (taxCode) => {
        setLoading(true);
        try {
            const response = await companyService.checkTaxCode(taxCode);
            return response.data; // Trường hợp thành công (code 200)
        } catch (err) {
            // QUAN TRỌNG: Nếu có phản hồi từ server (ví dụ 400 Bad Request kèm code 6002)
            if (err.response && err.response.data) {
                return err.response.data;
            }
            return null; // Lỗi kết nối mạng (ERR_CONNECTION_REFUSED)
        } finally {
            setLoading(false);
        }
    };

    return { checkTaxCode, loading };
};