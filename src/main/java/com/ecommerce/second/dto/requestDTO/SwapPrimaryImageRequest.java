package com.ecommerce.second.dto.requestDTO;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SwapPrimaryImageRequest {

    @NotNull(message = "oldImageId is required")
    private Integer oldImageId;

    @NotNull(message = "newImageId is required")
    private Integer newImageId;
}
