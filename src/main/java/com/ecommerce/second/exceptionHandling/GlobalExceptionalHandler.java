package com.ecommerce.second.exceptionHandling;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.authorization.AuthorizationDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

@RestControllerAdvice
public class GlobalExceptionalHandler extends ResponseEntityExceptionHandler {

    @ExceptionHandler(ProductNotFoundException.class)
    public ResponseEntity<?> handleProductNotFound(ProductNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ErrorMessageFormat.builder()
                        .timeStamp(LocalDateTime.now())
                        .mess(List.of(ex.getMessage()))
                        .build());
    }

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<?> handleUserNotFound(UserNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ErrorMessageFormat.builder()
                        .timeStamp(LocalDateTime.now())
                        .mess(List.of(ex.getMessage()))
                        .build());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<?> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ErrorMessageFormat.builder()
                        .timeStamp(LocalDateTime.now())
                        .mess(List.of(ex.getMessage()))
                        .build());
    }

    @ExceptionHandler(AuthorizationDeniedException.class)
    public ResponseEntity<ErrorMessageFormat> handleSpringAuthDenied(
            AuthorizationDeniedException ex, WebRequest request) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                ErrorMessageFormat.builder()
                        .timeStamp(LocalDateTime.now())
                        .mess(List.of("Access denied: you don't have the required role"))
                        .desc(request.getDescription(false))
                        .build());
    }

    /**
     * ── NEW ──────────────────────────────────────────────────────────────────
     * Handles business-rule violations (duplicate vendor, bad SKU, etc.)
     * Returns 409 CONFLICT so the frontend can show a friendly message.
     * ─────────────────────────────────────────────────────────────────────────
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorMessageFormat> handleIllegalArgument(
            IllegalArgumentException ex, WebRequest request) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(
                ErrorMessageFormat.builder()
                        .timeStamp(LocalDateTime.now())
                        .mess(List.of(ex.getMessage()))
                        .desc(request.getDescription(false))
                        .build());
    }

    /**
     * ── NEW ──────────────────────────────────────────────────────────────────
     * Handles state-machine / workflow violations (e.g. cart empty on checkout).
     * Returns 422 UNPROCESSABLE_ENTITY.
     * ─────────────────────────────────────────────────────────────────────────
     */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorMessageFormat> handleIllegalState(
            IllegalStateException ex, WebRequest request) {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(
                ErrorMessageFormat.builder()
                        .timeStamp(LocalDateTime.now())
                        .mess(List.of(ex.getMessage()))
                        .desc(request.getDescription(false))
                        .build());
    }

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            @SuppressWarnings("null") MethodArgumentNotValidException ex,
            @SuppressWarnings("null") HttpHeaders headers,
            @SuppressWarnings("null") HttpStatusCode status,
            @SuppressWarnings("null") WebRequest request) {

        List<String> message = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(e -> e.getField() + " " + e.getDefaultMessage())
                .toList();

        ErrorMessageFormat errorMessageFormat = ErrorMessageFormat.builder()
                .timeStamp(LocalDateTime.now())
                .mess(message)
                .desc(request.getDescription(false))
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorMessageFormat);
    }

    @Override
    protected ResponseEntity<Object> handleHttpMessageNotReadable(
            @SuppressWarnings("null") HttpMessageNotReadableException ex,
            @SuppressWarnings("null") HttpHeaders headers,
            @SuppressWarnings("null") HttpStatusCode status,
            @SuppressWarnings("null") WebRequest request) {

        ErrorMessageFormat error = ErrorMessageFormat.builder()
                .timeStamp(LocalDateTime.now())
                .mess(List.of(ex.getMostSpecificCause().getMessage()))
                .desc(request.getDescription(false))
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    /** Catch-all — only fires for truly unexpected errors. */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorMessageFormat> handleAll(Exception ex, WebRequest request) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                ErrorMessageFormat.builder()
                        .timeStamp(LocalDateTime.now())
                        .mess(List.of("Internal server error: " + ex.getClass().getSimpleName()))
                        .desc(request.getDescription(false))
                        .build());
    }
}