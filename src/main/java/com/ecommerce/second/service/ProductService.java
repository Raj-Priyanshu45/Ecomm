package com.ecommerce.second.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.ecommerce.second.dto.requestDTO.CreateProducts;
import com.ecommerce.second.dto.requestDTO.ModifyProducts;
import com.ecommerce.second.dto.responseDTO.AddProduct;
import com.ecommerce.second.dto.responseDTO.ChangeImageGETResponse;
import com.ecommerce.second.exceptionHandling.AccessDeniedException;
import com.ecommerce.second.exceptionHandling.ImageNotFoundException;
import com.ecommerce.second.exceptionHandling.ProductNotFoundException;
import com.ecommerce.second.exceptionHandling.UserNotFoundException;
import com.ecommerce.second.model.ProductImages;
import com.ecommerce.second.model.Products;
import com.ecommerce.second.model.Tags;
import com.ecommerce.second.model.User;
import com.ecommerce.second.repo.ProductImagesRepo;
import com.ecommerce.second.repo.ProductRepo;
import com.ecommerce.second.repo.TagRepo;
import com.ecommerce.second.repo.UserRepo;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class ProductService {

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; 
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("png", "jpg", "jpeg", "webp");
    private static final Path UPLOAD_PATH = Paths.get("uploads");

    private final Logger logger = LoggerFactory.getLogger(getClass());
    private final ProductRepo productRepo;
    private final UserRepo userRepo;
    private final TagRepo tagRepo;
    private final ProductImagesRepo imageRepo;

    public User getCurrentUser(Authentication authentication) {
        return userRepo.findByKeyCloakId(authentication.getName())
                .orElseThrow(() -> new UserNotFoundException("User not found"));
    }

    public Products getProducts(int id) {
        return productRepo.findById(id)
                .orElseThrow(() -> new ProductNotFoundException("Product not found"));
    }

    public ProductImages getProductImage(int id) {
        return imageRepo.findById(id)
                .orElseThrow(() -> new ImageNotFoundException("Image not found"));
    }

    public boolean authCheck(Authentication authentication, String role) {
        return authentication.getAuthorities()
                .stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_" + role.toUpperCase()));
    }

    
    private void assertOwnerOrAdmin(Authentication authentication, Products product, User user) {
        boolean isAdmin = authCheck(authentication, "admin");
        if (!isAdmin && !product.getSeller().getKeyCloakId().equals(user.getKeyCloakId())) {
            throw new AccessDeniedException("You don't have permission to modify this product");
        }
    }

    private String toSlug(String tag) {
        return tag.trim().toLowerCase().replaceAll("\\s+", "-");
    }


    public AddProduct saveProduct(CreateProducts request, Authentication authentication) {
        User user = getCurrentUser(authentication);
        Set<Tags> tags = resolveTags(request.getTags());

        Products newProduct = productRepo.save(
                Products.builder()
                        .name(request.getName())
                        .price(request.getPrice())
                        .description(request.getDescription())
                        .seller(user)
                        .isDel(false)
                        .tags(tags)
                        .build());

        logger.info("Product created: id={}", newProduct.getId());

        return AddProduct.builder()
                .name(newProduct.getName())
                .description(newProduct.getDescription())
                .price(newProduct.getPrice())
                .sellerId(user.getKeyCloakId())
                .productId(newProduct.getId())
                .tags(request.getTags())
                .build();
    }

    public AddProduct modifyProduct(int id, ModifyProducts request, Authentication authentication) {
        User user = getCurrentUser(authentication);
        Products product = getProducts(id);

        assertOwnerOrAdmin(authentication, product, user);

        Set<Tags> tags = resolveTags(request.getTags());
        List<String> tagNames = tags.stream().map(Tags::getName).toList();

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setTags(tags);

        productRepo.save(product);
        logger.info("Product modified: id={}", id);

        return AddProduct.builder()
                .name(product.getName())
                .description(product.getDescription())
                .price(product.getPrice())
                .sellerId(authentication.getName())
                .productId(product.getId())
                .tags(tagNames)
                .build();
    }

    public String deleteProduct(int id, Authentication authentication) {
        User user = getCurrentUser(authentication);
        Products product = getProducts(id);

        boolean isAdmin   = authCheck(authentication, "admin");
        boolean isSupport = authCheck(authentication, "support");

        if (!isAdmin && !isSupport && !product.getSeller().getKeyCloakId().equals(user.getKeyCloakId())) {
            logger.warn("Unauthorized delete attempt on product id={} by user={}", id, user.getKeyCloakId());
            throw new AccessDeniedException("You can't delete this product");
        }

        productRepo.deleteById(id);
        logger.info("Product deleted: id={}", id);
        return product.getName();
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
        String extension  = originalName.substring(dotIndex + 1).toLowerCase();
        String dotExt     = originalName.substring(dotIndex);

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

    public List<String> uploadImages(int productId, int primaryImageIndex,
            MultipartFile[] files, Authentication authentication) throws IOException {

        Products product = getProducts(productId);
        User user = getCurrentUser(authentication);

        assertOwnerOrAdmin(authentication, product, user);

        boolean alreadyHasPrimary = imageRepo.existsByProductIdAndPrimaryImageTrue(productId);
        List<String> savedUrls = new ArrayList<>();

        for (int i = 0; i < files.length; i++) {
            String imageUrl = saveFileToDisk(files[i]);
            boolean isPrimary = !alreadyHasPrimary && (primaryImageIndex == i);

            imageRepo.save(ProductImages.builder()
                    .imageUrl(imageUrl)
                    .primaryImage(isPrimary)
                    .product(product)
                    .build());

            savedUrls.add(imageUrl);
        }

        logger.info("Uploaded {} image(s) for product id={}", files.length, productId);
        return savedUrls;
    }

    
    public String modifyImage(int productId, int imageId,
            MultipartFile newFile, Authentication authentication) throws IOException {

        Products product = getProducts(productId);
        User user = getCurrentUser(authentication);

        assertOwnerOrAdmin(authentication, product, user);

        ProductImages image = getProductImage(imageId);
        if (image.getProduct().getId() != productId) {
            throw new IllegalArgumentException("Image does not belong to this product");
        }

        deleteFileFromDisk(image.getImageUrl());
        String newUrl = saveFileToDisk(newFile);

        image.setImageUrl(newUrl);
        imageRepo.save(image);

        logger.info("Image id={} replaced for product id={}", imageId, productId);
        return newUrl;
    }

  
    public void deleteImage(int productId, int imageId, Authentication authentication) throws IOException {
        Products product = getProducts(productId);
        User user = getCurrentUser(authentication);

        assertOwnerOrAdmin(authentication, product, user);

        ProductImages image = getProductImage(imageId);
        if (image.getProduct().getId() != productId) {
            throw new ImageNotFoundException("Image does not belong to this product");
        }

        deleteFileFromDisk(image.getImageUrl());
        imageRepo.delete(image);

        logger.info("Image id={} deleted from product id={}", imageId, productId);
    }

    public void deleteAllImages(int productId, Authentication authentication) throws IOException {
        Products product = getProducts(productId);
        User user = getCurrentUser(authentication);

        assertOwnerOrAdmin(authentication, product, user);

        List<ProductImages> images = imageRepo.findByProductId(productId);
        if (images.isEmpty()) {
            throw new ImageNotFoundException("No images found for this product");
        }

        for (ProductImages img : images) {
            deleteFileFromDisk(img.getImageUrl());
        }

        imageRepo.deleteByProductId(productId);
        logger.info("All images deleted for product id={}", productId);
    }


    public ChangeImageGETResponse getImagesInfo(int productId, Authentication authentication) {
        Products product = getProducts(productId);
        User user = getCurrentUser(authentication);

        assertOwnerOrAdmin(authentication, product, user);

        List<ProductImages> imageList = imageRepo.findByProductId(productId);
        if (imageList.isEmpty()) {
            throw new ImageNotFoundException("No images found for this product");
        }

        List<String> urls = new ArrayList<>();
        String primaryUrl = "Not Assigned";

        for (ProductImages img : imageList) {
            urls.add(img.getImageUrl());
            if (img.isPrimaryImage()) {
                primaryUrl = img.getImageUrl();
            }
        }

        return new ChangeImageGETResponse(urls, imageList.size(), primaryUrl);
    }

    public void updatePrimaryImage(int productId, int oldPrimaryImageId, int newPrimaryImageId,
            Authentication authentication) {

        if (oldPrimaryImageId == newPrimaryImageId) {
            throw new IllegalArgumentException("Old and new primary images cannot be the same");
        }

        Products product = getProducts(productId);
        User user = getCurrentUser(authentication);

        assertOwnerOrAdmin(authentication, product, user);

        ProductImages oldPrimary = getProductImage(oldPrimaryImageId);
        ProductImages newPrimary = getProductImage(newPrimaryImageId);

        if (oldPrimary.getProduct().getId() != productId ||
                newPrimary.getProduct().getId() != productId) {
            throw new IllegalArgumentException("One or both images do not belong to this product");
        }

        oldPrimary.setPrimaryImage(false);
        newPrimary.setPrimaryImage(true);

        imageRepo.save(oldPrimary);
        imageRepo.save(newPrimary);

        logger.info("Primary image updated for product id={}: {} → {}", productId, oldPrimaryImageId, newPrimaryImageId);
    }

    
    private Set<Tags> resolveTags(List<String> tagNames) {
        Set<Tags> tags = new HashSet<>();
        for (String name : tagNames) {
            String slug = toSlug(name);
            Tags tag = tagRepo.findBySlug(slug)
                    .orElseGet(() -> tagRepo.save(
                            Tags.builder()
                                    .name(name.trim().toLowerCase())
                                    .slug(slug)
                                    .build()));
            tags.add(tag);
        }
        return tags;
    }
}