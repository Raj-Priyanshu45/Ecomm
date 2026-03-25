package com.ecommerce.second.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.Path;

import java.util.Set;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class FileStorageService {
    
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; 
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("png", "jpg", "jpeg", "webp");
    private static final Path UPLOAD_PATH = Paths.get("uploads");

    @Async("threadExecutor")
    public CompletableFuture<String> saveFileToDisk(MultipartFile file) throws IOException {
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

        return CompletableFuture.completedFuture("/uploads/" + fileName);
    }

    @Async("threadExecutor")
    public CompletableFuture<Void> deleteFileFromDisk(String imageUrl) throws IOException {
        Path path = UPLOAD_PATH.resolve(imageUrl.replace("/uploads/", ""));
        Files.deleteIfExists(path);
        return CompletableFuture.completedFuture(null);
    }

}
