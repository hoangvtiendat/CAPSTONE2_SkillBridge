import Swal from 'sweetalert2';

export default async function confirmAction({
    title = 'Xác nhận thao tác',
    text = 'Bạn có chắc chắn muốn tiếp tục?',
    confirmText = 'Đồng ý',
    cancelText = 'Hủy',
    icon = 'warning',
    confirmButtonColor = '#2563eb'
} = {}) {
    const result = await Swal.fire({
        title,
        text,
        icon,
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,
        confirmButtonColor,
        cancelButtonColor: '#64748b'
    });

    return result.isConfirmed;
}
