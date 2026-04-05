package com.ecommerce.second.service;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.ecommerce.second.dto.requestDTO.VarientRequest;
import com.ecommerce.second.dto.responseDTO.FileUploadResponse;
import com.ecommerce.second.dto.responseDTO.VariantResponse;
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
@SuppressWarnings("null")
public class VariantService {


    //private static final Path UPLOAD_PATH = Paths.get("uploads");

    private final Logger logger = LoggerFactory.getLogger(getClass());

    private final ProductService productService;
    private final InventoryRepo inventoryRepo;
    private final ProductVarientsRepo productVariantsRepo;
    private final VarientAttrRepo variantAttrRepo;
    private final VarImageRepo varImageRepo;
    private final FileStorageService imageService;

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


    private String buildSkuCode(String productName, String key, String value) {
        return productName + "-" + key.trim().toLowerCase() + "-" + value.trim().toLowerCase();
    }

    // ─────────────────────────────────────────────────────────────

    /**
     * Fetch all variants for a product with full details (prices, stock, images).
     */
    public List<VariantResponse> getVariants(int productId) {
    List<ProductVariant> variants = productVariantsRepo.findByProductId(productId);

    return variants.stream()
            .<VariantResponse>map(v -> {                          // ← explicit type witness
                VariantAttribute attr = variantAttrRepo.findBySkuCode(v.getSkuCode())
                        .stream().findFirst().orElse(null);
                Inventory inv = inventoryRepo.findBySkuCode(v.getSkuCode()).orElse(null);

                List<VariantResponse.VariantImageResponse> imageResponses = v.getImages() != null
                        ? v.getImages().stream()
                                .<VariantResponse.VariantImageResponse>map(img ->  // ← explicit type witness
                                        VariantResponse.VariantImageResponse.builder()
                                                .id(img.getId())
                                                .imageUrl(img.getImageUrl())
                                                .primary(img.isPrimaryImage())     // ← was isPrimary()
                                                .build()
                                ).toList()
                        : List.<VariantResponse.VariantImageResponse>of();         // ← typed List.of()

                return VariantResponse.builder()
                        .id(v.getId())
                        .skuCode(v.getSkuCode())
                        .price(v.getPrice())
                        .key(attr != null ? attr.getName() : null)
                        .value(attr != null ? attr.getValue() : null)
                        .quantity(inv != null ? inv.getQuantity() : 0)
                        .images(imageResponses)
                        .build();
            }).toList();
}

    // ─────────────────────────────────────────────────────────────

    @SuppressWarnings("null")
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
            imageService.deleteFileFromCloud(img.getPublicId());
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

        imageService.deleteFileFromCloud(image.getPublicId());
        FileUploadResponse newUrl = imageService.saveFileToDisk(newFile).join();

        image.setImageUrl(newUrl.getUrl());
        image.setPublicId(newUrl.getFilname());
        varImageRepo.save(image);

        logger.info("Variant image replaced: imageId={}, variantId={}", imageId, variantId);
        return newUrl.getUrl();
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

        imageService.deleteFileFromCloud(image.getPublicId());
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
            imageService.deleteFileFromCloud(img.getPublicId());
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
            // String imageUrl = saveFileToDisk(files[i]);

            FileUploadResponse imageUrl = imageService.saveFileToDisk(files[i]).join();
            boolean isPrimary = !alreadyHasPrimary && (primaryImageIndex == i);

            varImageRepo.save(VarientImage.builder()
                    .imageUrl(imageUrl.getUrl())
                    .publicId(imageUrl.getFilname())
                    .primaryImage(isPrimary)
                    .varient(variant)
                    .build());

            savedUrls.add(imageUrl.getUrl());
        }
        return savedUrls;
    }
}
