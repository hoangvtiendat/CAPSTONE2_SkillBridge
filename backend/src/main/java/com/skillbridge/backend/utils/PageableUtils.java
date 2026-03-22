package com.skillbridge.backend.utils;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

@Component
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class PageableUtils {

    /**
     * @param page      Số trang (bắt đầu từ 0)
     * @param size      Số lượng phần tử trên mỗi trang
     * @param sortBy    Trường cần sắp xếp (vd: createdAt, name)
     * @param direction Hướng sắp xếp (asc hoặc desc)
     * @return Pageable
     */
    public static Pageable createPageable(int page, int size, String sortBy, String direction) {
        Sort sort = direction.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        return PageRequest.of(page, size, sort);
    }
}