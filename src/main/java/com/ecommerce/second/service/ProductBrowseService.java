package com.ecommerce.second.service;

import com.ecommerce.second.dto.responseDTO.AllProductResponse;
import com.ecommerce.second.dto.responseDTO.ApiResponse;
import com.ecommerce.second.dto.responseDTO.SingleProductResponse;
import com.ecommerce.second.exceptionHandling.ProductNotFoundException;
import com.ecommerce.second.model.ProductImages;
import com.ecommerce.second.model.Products;
import com.ecommerce.second.repo.ProductImagesRepo;
import com.ecommerce.second.repo.ProductRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ProductBrowseService {

    private final ProductRepo productRepo;
    private final ProductImagesRepo imageRepo;

    public ApiResponse<AllProductResponse> listProducts(
            int page, int size, String sortBy, String direction) {

        Sort sort = direction.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Products> result = productRepo.findAll(pageable);

        List<AllProductResponse> content = result.getContent()
                .stream()
                .map(this::toAllProductResponse)
                .toList();

        return new ApiResponse<>(content, result.getSize(), result.getNumber(),
                result.getTotalElements(), result.getTotalPages(), result.isLast());
    }

    public SingleProductResponse getProductDetail(int id) {
        Products product = productRepo.findById(id)
                .orElseThrow(() -> new ProductNotFoundException("Product not found: " + id));

        return new SingleProductResponse(
                product.getName(),
                product.getDescription(),
                product.getSeller().getKeyCloakId(),
                product.getCreatedAt(),
                product.getUpdatedAt(),
                new ArrayList<>(product.getTags())
        );
    }

    public ApiResponse<AllProductResponse> listByTag(String slug, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("updatedAt").descending());
        Page<Products> result = productRepo.findByTags_Slug(slug, pageable);

        List<AllProductResponse> content = result.getContent()
                .stream()
                .map(this::toAllProductResponse)
                .toList();

        return new ApiResponse<>(content, result.getSize(), result.getNumber(),
                result.getTotalElements(), result.getTotalPages(), result.isLast());
    }

    private AllProductResponse toAllProductResponse(Products p) {
        // Primary image URL, falling back to first available image
        List<ProductImages> images = imageRepo.findByProductId(p.getId());
        String imageUrl = images.stream()
                .filter(ProductImages::isPrimaryImage)
                .map(ProductImages::getImageUrl)
                .findFirst()
                .orElseGet(() -> images.stream()
                        .map(ProductImages::getImageUrl)
                        .findFirst()
                        .orElse(""));

        // Short description — first 120 chars
        String shortDesc = p.getDescription().length() > 120
                ? p.getDescription().substring(0, 120) + "\u2026"
                : p.getDescription();

        // inStock: true if any inventory record has available > 0
        // For now a simple placeholder — wire to InventoryRepo once orders are built
        boolean inStock = !images.isEmpty();

        return new AllProductResponse(
                p.getId(), p.getName(), shortDesc, imageUrl,
                p.getPrice(), inStock, new ArrayList<>(p.getTags())
        );
    }
}