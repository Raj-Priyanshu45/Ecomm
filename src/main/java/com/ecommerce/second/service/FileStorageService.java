package com.ecommerce.second.service;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.cloudinary.Cloudinary;
import com.cloudinary.Transformation;
import com.cloudinary.utils.ObjectUtils;
import com.ecommerce.second.dto.responseDTO.FileUploadResponse;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service

public class FileStorageService {
    
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; 

    private final Cloudinary cloudinary;

    // @Async("threadExecutor")
    // public CompletableFuture<String> saveFileToDisk(MultipartFile file) throws IOException {
    //     if (file.getSize() > MAX_FILE_SIZE) {
    //         throw new IllegalArgumentException("File too large (max 5 MB)");
    //     }

    //     String originalName = file.getOriginalFilename();
    //     if (originalName == null || !originalName.contains(".")) {
    //         throw new IllegalArgumentException("Invalid file name");
    //     }

    //     String contentType = file.getContentType();
    //     if (contentType == null || !contentType.startsWith("image/")) {
    //         throw new IllegalArgumentException("File must be an image");
    //     }

    //     int dotIndex = originalName.lastIndexOf('.');
    //     String extension  = originalName.substring(dotIndex + 1).toLowerCase();
    //     String dotExt     = originalName.substring(dotIndex);

    //     if (!ALLOWED_EXTENSIONS.contains(extension)) {
    //         throw new IllegalArgumentException("Invalid image format. Allowed: png, jpg, jpeg, webp");
    //     }

    //     if (!Files.exists(UPLOAD_PATH)) {
    //         Files.createDirectories(UPLOAD_PATH);
    //     }

    //     String fileName = UUID.randomUUID() + dotExt;
    //     Files.copy(file.getInputStream(), UPLOAD_PATH.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);

    //     return CompletableFuture.completedFuture("/uploads/" + fileName);
    // }

    @Async("threadExecutor")
    public CompletableFuture<Void> deleteFileFromCloud(String publicId) throws IOException {

        cloudinary.uploader().destroy(publicId, Map.of());

        return CompletableFuture.completedFuture(null);
    }

    @Async("threadExecutor")
    public CompletableFuture<FileUploadResponse> saveFileToDisk(MultipartFile image){

        if (image.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File too large (max 5 MB)");
        }

        String originalName = image.getOriginalFilename();
        if (originalName == null || !originalName.contains(".")) {
            throw new IllegalArgumentException("Invalid file name");
        }

        String contentType = image.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("File must be an image");
        }

        
        try {
            byte[] data = new byte[image.getInputStream().available()];
            image.getInputStream().read(data);

            String filename = UUID.randomUUID().toString();

            cloudinary.uploader().upload(data, 
                ObjectUtils.asMap(
                    "public_id" , filename
                )
            );


            return CompletableFuture.completedFuture(new FileUploadResponse(getUrl(filename) , filename));

        } catch (IOException ex) {
            System.getLogger(FileStorageService.class.getName()).log(System.Logger.Level.ERROR, (String) null, ex);
        }

        return null;
    }

    private String getUrl(String publicId){
        return cloudinary.url()
                    .transformation(new Transformation<>())
                    .generate(publicId);
    }

}
