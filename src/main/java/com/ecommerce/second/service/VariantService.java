package com.ecommerce.second.service;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.ecommerce.second.dto.requestDTO.VarientRequest;
import com.ecommerce.second.exceptionHandling.AccessDeniedException;
import com.ecommerce.second.exceptionHandling.ImageNotFoundException;
import com.ecommerce.second.model.Inventory;
import com.ecommerce.second.model.ProductVariant;
import com.ecommerce.second.model.Products;
import com.ecommerce.second.model.User;
import com.ecommerce.second.model.VariantAttribute;
import com.ecommerce.second.model.VarientImage;
import com.ecommerce.second.repo.InventoryRepo;
import com.ecommerce.second.repo.ProductVarientsRepo;
import com.ecommerce.second.repo.VarImageRepo;
import com.ecommerce.second.repo.VarientAttrRepo;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class VariantService {

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("png", "jpg", "jpeg", "webp");
    private static final Path UPLOAD_PATH = Paths.get("uploads");

    private final Logger logger = LoggerFactory.getLogger(getClass());

    private final ProductService productService;
    private final InventoryRepo inventoryRepo;
    private final ProductVarientsRepo productVariantsRepo;
    private final VarientAttrRepo variantAttrRepo;
    private final VarImageRepo varImageRepo;

    // ─────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────

    private ProductVariant getVariant(int variantId) {
        return productVariantsRepo.findById(variantId)
                .orElseThrow(() -> new EntityNotFoundException("Variant not found: " + variantId));
    }

    private VarientImage getVariantImage(int imageId) {
        return varImageRepo.findById(imageId)
                .orElseThrow(() -> new ImageNotFoundException("Image not found: " + imageId));
    }

    private Inventory getInventory(String skuCode) {
        return inventoryRepo.findBySkuCode(skuCode)
                .orElseThrow(() -> new EntityNotFoundException("Inventory not found for SKU: " + skuCode));
    }

    private void assertOwnerOrAdmin(Authentication authentication, Products product, User user) {
        boolean isAdmin = productService.authCheck(authentication, "admin");
        if (!isAdmin && !product.getSeller().getKeyCloakId().equals(user.getKeyCloakId())) {
            throw new AccessDeniedException("You don't have permission to modify this product");
        }
    }

    private String saveFileToDisk(MultipartFile file) throws IOException {
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File too large (max 5 MB)");
        }
        String originalName = file.getOriginalFilename();
        if (originalName == null || !originalName.contains(".")) {
            throw new IllegalArgumentException("Invalid file name");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("File must be an image");
        }
        int dotIndex = originalName.lastIndexOf('.');
        String extension = originalName.substring(dotIndex + 1).toLowerCase();
        String dotExt    = originalName.substring(dotIndex);
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("Invalid image format. Allowed: png, jpg, jpeg, webp");
        }
        if (!Files.exists(UPLOAD_PATH)) {
            Files.createDirectories(UPLOAD_PATH);
        }
        String fileName = UUID.randomUUID() + dotExt;
        Files.copy(file.getInputStream(), UPLOAD_PATH.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);
        return "/uploads/" + fileName;
    }

    private void deleteFileFromDisk(String imageUrl) throws IOException {
        Path path = UPLOAD_PATH.resolve(imageUrl.replace("/uploads/", ""));
        Files.deleteIfExists(path);
    }

    private String buildSkuCode(String productName, String key, String value) {
        return productName + "-" + key.trim().toLowerCase() + "-" + value.trim().toLowerCase();
    }

    // ─────────────────────────────────────────────────────────────
    // Variant CRUD
    // ─────────────────────────────────────────────────────────────

    public void addVariant(VarientRequest request, int productId,
            Authentication authentication, MultipartFile[] files, int primaryImageIndex) throws IOException {

        Products product = productService.getProducts(productId);
        User user = productService.getCurrentUser(authentication);
        assertOwnerOrAdmin(authentication, product, user);

        String skuCode = buildSkuCode(product.getName(), request.getKey(), request.getValue());

        if (variantAttrRepo.existsBySkuCode(skuCode)) {
            throw new IllegalArgumentException("Variant with this attribute already exists");
        }

        variantAttrRepo.save(VariantAttribute.builder()
                .name(request.getKey())
                .value(request.getValue())
                .skuCode(skuCode)
                .product(product)
                .build());

        inventoryRepo.save(Inventory.builder()
                .quantity(request.getQuantity())
                .available(request.getQuantity())
                .reserved(0)
                .skuCode(skuCode)
                .build());

        ProductVariant variant = productVariantsRepo.save(ProductVariant.builder()
                .skuCode(skuCode)
                .productId(productId)
                .price(request.getPrice())
                .build());

        saveVariantImages(files, primaryImageIndex, variant);
        logger.info("Variant created: skuCode={} for productId={}", skuCode, productId);
    }

    public void modifyVariantPrice(int variantId, BigDecimal newPrice,
            int productId, Authentication authentication) {

        Products product = productService.getProducts(productId);
        User user = productService.getCurrentUser(authentication);
        assertOwnerOrAdmin(authentication, product, user);

        ProductVariant variant = getVariant(variantId);
        if (variant.getProductId() != productId) {
            throw new IllegalArgumentException("Variant does not belong to this product");
        }

        variant.setPrice(newPrice);
        productVariantsRepo.save(variant);
        logger.info("Variant price updated: variantId={}", variantId);
    }

    public void modifyVariantStock(int variantId, int newQuantity,
            int productId, Authentication authentication) {

        Products product = productService.getProducts(productId);
        User user = productService.getCurrentUser(authentication);
        assertOwnerOrAdmin(authentication, product, user);

        ProductVariant variant = getVariant(variantId);
        if (variant.getProductId() != productId) {
            throw new IllegalArgumentException("Variant does not belong to this product");
        }

        Inventory inventory = getInventory(variant.getSkuCode());
        int delta = newQuantity - inventory.getQuantity();

        inventory.setQuantity(newQuantity);
        // Ensure available never drops below 0 or exceeds newQuantity
        inventory.setAvailable(Math.max(0, Math.min(newQuantity, inventory.getAvailable() + delta)));
        inventoryRepo.save(inventory);

        logger.info("Inventory updated: skuCode={}, newQty={}", variant.getSkuCode(), newQuantity);
    }

    public void deleteVariant(int variantId, int productId,
            Authentication authentication) throws IOException {

        Products product = productService.getProducts(productId);
        User user = productService.getCurrentUser(authentication);
        assertOwnerOrAdmin(authentication, product, user);

        ProductVariant variant = getVariant(variantId);
        if (variant.getProductId() != productId) {
            throw new IllegalArgumentException("Variant does not belong to this product");
        }

        List<VarientImage> images = varImageRepo.findByVarientId(variantId);
        for (VarientImage img : images) {
            deleteFileFromDisk(img.getImageUrl());
        }

        // orphanRemoval=true on ProductVariant.images handles VarientImage DB rows
        inventoryRepo.deleteBySkuCode(variant.getSkuCode());
        variantAttrRepo.deleteBySkuCode(variant.getSkuCode());
        productVariantsRepo.deleteById(variantId);

        logger.info("Variant deleted: variantId={}, skuCode={}", variantId, variant.getSkuCode());
    }

    // ─────────────────────────────────────────────────────────────
    // Variant Image Management
    // ─────────────────────────────────────────────────────────────

    public List<String> uploadVariantImages(MultipartFile[] files, int primaryImageIndex,
            int variantId, int productId, Authentication authentication) throws IOException {

        Products product = productService.getProducts(productId);
        User user = productService.getCurrentUser(authentication);
        assertOwnerOrAdmin(authentication, product, user);

        ProductVariant variant = getVariant(variantId);
        if (variant.getProductId() != productId) {
            throw new IllegalArgumentException("Variant does not belong to this product");
        }

        return saveVariantImages(files, primaryImageIndex, variant);
    }

    public String modifyVariantImage(int imageId, int variantId,
            int productId, MultipartFile newFile, Authentication authentication) throws IOException {

        Products product = productService.getProducts(productId);
        User user = productService.getCurrentUser(authentication);
        assertOwnerOrAdmin(authentication, product, user);

        ProductVariant variant = getVariant(variantId);
        if (variant.getProductId() != productId) {
            throw new IllegalArgumentException("Variant does not belong to this product");
        }

        VarientImage image = getVariantImage(imageId);
        if (image.getVarient().getId() != variantId) {
            throw new IllegalArgumentException("Image does not belong to this variant");
        }

        deleteFileFromDisk(image.getImageUrl());
        String newUrl = saveFileToDisk(newFile);
        image.setImageUrl(newUrl);
        varImageRepo.save(image);

        logger.info("Variant image replaced: imageId={}, variantId={}", imageId, variantId);
        return newUrl;
    }

    public void deleteVariantImage(int imageId, int variantId,
            int productId, Authentication authentication) throws IOException {

        Products product = productService.getProducts(productId);
        User user = productService.getCurrentUser(authentication);
        assertOwnerOrAdmin(authentication, product, user);

        ProductVariant variant = getVariant(variantId);
        if (variant.getProductId() != productId) {
            throw new IllegalArgumentException("Variant does not belong to this product");
        }

        VarientImage image = getVariantImage(imageId);
        if (image.getVarient().getId() != variantId) {
            throw new ImageNotFoundException("Image does not belong to this variant");
        }

        deleteFileFromDisk(image.getImageUrl());
        varImageRepo.delete(image);
        logger.info("Variant image deleted: imageId={}, variantId={}", imageId, variantId);
    }

    public void deleteAllVariantImages(int variantId, int productId,
            Authentication authentication) throws IOException {

        Products product = productService.getProducts(productId);
        User user = productService.getCurrentUser(authentication);
        assertOwnerOrAdmin(authentication, product, user);

        ProductVariant variant = getVariant(variantId);
        if (variant.getProductId() != productId) {
            throw new IllegalArgumentException("Variant does not belong to this product");
        }

        List<VarientImage> images = varImageRepo.findByVarientId(variantId);
        if (images.isEmpty()) {
            throw new ImageNotFoundException("No images found for this variant");
        }

        for (VarientImage img : images) {
            deleteFileFromDisk(img.getImageUrl());
        }
        varImageRepo.deleteByVarientId(variantId);
        logger.info("All images deleted for variantId={}", variantId);
    }

    public void updatePrimaryVariantImage(int oldImageId, int newImageId,
            int variantId, int productId, Authentication authentication) {

        if (oldImageId == newImageId) {
            throw new IllegalArgumentException("Old and new primary images cannot be the same");
        }

        Products product = productService.getProducts(productId);
        User user = productService.getCurrentUser(authentication);
        assertOwnerOrAdmin(authentication, product, user);

        ProductVariant variant = getVariant(variantId);
        if (variant.getProductId() != productId) {
            throw new IllegalArgumentException("Variant does not belong to this product");
        }

        VarientImage oldPrimary = getVariantImage(oldImageId);
        VarientImage newPrimary = getVariantImage(newImageId);

        if (oldPrimary.getVarient().getId() != variantId || newPrimary.getVarient().getId() != variantId) {
            throw new IllegalArgumentException("One or both images do not belong to this variant");
        }

        oldPrimary.setPrimaryImage(false);
        newPrimary.setPrimaryImage(true);
        varImageRepo.save(oldPrimary);
        varImageRepo.save(newPrimary);

        logger.info("Primary variant image updated: variantId={}, {} -> {}", variantId, oldImageId, newImageId);
    }

    // ─────────────────────────────────────────────────────────────
    // Private utility
    // ─────────────────────────────────────────────────────────────

    private List<String> saveVariantImages(MultipartFile[] files,
            int primaryImageIndex, ProductVariant variant) throws IOException {

        boolean alreadyHasPrimary = varImageRepo.existsByVarientIdAndPrimaryImageTrue(variant.getId());
        List<String> savedUrls = new ArrayList<>();

        for (int i = 0; i < files.length; i++) {
            String imageUrl = saveFileToDisk(files[i]);
            boolean isPrimary = !alreadyHasPrimary && (primaryImageIndex == i);

            varImageRepo.save(VarientImage.builder()
                    .imageUrl(imageUrl)
                    .primaryImage(isPrimary)
                    .varient(variant)
                    .build());

            savedUrls.add(imageUrl);
        }
        return savedUrls;
    }
}
