package com.ecommerce.second.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ecommerce.second.dto.responseDTO.AllProductResponse;
import com.ecommerce.second.dto.responseDTO.ApiResponse;
import com.ecommerce.second.dto.responseDTO.SingleProductResponse;
import com.ecommerce.second.exceptionHandling.ProductNotFoundException;
import com.ecommerce.second.model.ProductImages;
import com.ecommerce.second.model.Products;
import com.ecommerce.second.model.VariantAttribute;
import com.ecommerce.second.repo.InventoryRepo;
import com.ecommerce.second.repo.ProductImagesRepo;
import com.ecommerce.second.repo.ProductRepo;

import com.ecommerce.second.repo.VarientAttrRepo;

import lombok.RequiredArgsConstructor;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ProductBrowseService {

    private final ProductRepo productRepo;
    private final ProductImagesRepo imageRepo;
    private final InventoryRepo inventoryRepo;
    private final VarientAttrRepo attrRepo;

    // ─────────────────────────────────────────────────────────────
    // List all products (paginated + sortable)
    // ─────────────────────────────────────────────────────────────

    public ApiResponse<AllProductResponse> listProducts(
            int page, int size, String sortBy, String direction) {

        Sort sort = direction.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Products> result = productRepo.findAll(pageable);
        return toApiResponse(result);
    }

    // ─────────────────────────────────────────────────────────────
    // Single product detail
    // ─────────────────────────────────────────────────────────────

    public SingleProductResponse getProductDetail(int id) {
        Products product = productRepo.findById(id)
                .orElseThrow(() -> new ProductNotFoundException("Product not found: " + id));

        List<ProductImages> imageUrl = imageRepo.findByProductId(id);
        List<String> image = new ArrayList<>();
     

        for(int i =0 ; i <imageUrl.size() ; i++){
                image.add(imageUrl.get(i).getImageUrl());
        }

        List<VariantAttribute> varKey = attrRepo.findByProduct_Id(id);

        Map<String , List<String>> attr = new HashMap<>();

        for(int i = 0 ; i < varKey.size() ; i++){

                String key = varKey.get(i).getName();
                
                if(!attr.containsKey(key)){
                        List<String> list = new ArrayList<>();
                        attr.put(key, list);
                }
        }

        for(int i = 0 ; i < varKey.size() ; i++){

                VariantAttribute var = varKey.get(i);
                String key = var.getName();
                String value = var.getValue();

                attr.get(key).add(value);
        }


        return new SingleProductResponse(
                product.getName(),
                product.getDescription(),
                product.getSeller().getKeyCloakId(),
                product.getCreatedAt(),
                product.getUpdatedAt(),
                new ArrayList<>(product.getTags()),
                image , attr
        );
    }

    // ─────────────────────────────────────────────────────────────
    // Filter by tag slug
    // ─────────────────────────────────────────────────────────────

    public ApiResponse<AllProductResponse> listByTag(String slug, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("updatedAt").descending());
        Page<Products> result = productRepo.findByTags_Slug(slug, pageable);
        return toApiResponse(result);
    }

    // ─────────────────────────────────────────────────────────────
    // Keyword search by product name
    // ─────────────────────────────────────────────────────────────

    public ApiResponse<AllProductResponse> search(String q, int page, int size) {
        if (q == null || q.isBlank()) {
            return listProducts(page, size, "updatedAt", "desc");
        }
        Pageable pageable = PageRequest.of(page, size, Sort.by("updatedAt").descending());
        Page<Products> result = productRepo.findByNameContainingIgnoreCase(q.trim(), pageable);
        return toApiResponse(result);
    }

    // ─────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────

    private ApiResponse<AllProductResponse> toApiResponse(Page<Products> result) {
        List<AllProductResponse> content = result.getContent()
                .stream()
                .map(this::toAllProductResponse)
                .toList();
        return new ApiResponse<>(content, result.getSize(), result.getNumber(),
                result.getTotalElements(), result.getTotalPages(), result.isLast());
    }

    private AllProductResponse toAllProductResponse(Products p) {
        List<ProductImages> images = imageRepo.findByProductId(p.getId());

        String imageUrl = images.stream()
                .filter(ProductImages::isPrimaryImage)
                .map(ProductImages::getImageUrl)
                .findFirst()
                .orElseGet(() -> images.stream()
                        .map(ProductImages::getImageUrl)
                        .findFirst()
                        .orElse(""));

        String shortDesc = p.getDescription().length() > 120
                ? p.getDescription().substring(0, 120) + "\u2026"
                : p.getDescription();

        // inStock: true if any inventory SKU tied to this product has available > 0
        // Falls back to true if no variants exist (base-product assumed in stock)
        boolean inStock = inventoryRepo.findAll().stream()
                .filter(inv -> inv.getSkuCode() != null
                        && inv.getSkuCode().startsWith(p.getName() + "-"))
                .anyMatch(inv -> inv.getAvailable() > 0);

        // If there are no variants at all, treat as in-stock (seller manages manually)
        if (!inStock && images.isEmpty()) {
            inStock = false;
        } else if (!inStock) {
            inStock = true; // base product with no variants — assume in stock
        }

        return new AllProductResponse(
                p.getId(), p.getName(), shortDesc, imageUrl,
                p.getPrice(), inStock, new ArrayList<>(p.getTags()) , p.getRatingAverage()
        , p.getReviewCount()
        );
    }
}