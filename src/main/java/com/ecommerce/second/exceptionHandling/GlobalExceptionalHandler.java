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
public class GlobalExceptionalHandler extends ResponseEntityExceptionHandler{
    
    @ExceptionHandler(ProductNotFoundException.class)
    public ResponseEntity<?> handleProductNotFound(ProductNotFoundException ex) {
       
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ex.getMessage());
    }


    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<?> handleUserNotFound(UserNotFoundException ex) {
      
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ex.getMessage());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<?> handleAccessDenied(Exception ex) {
      

        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("Access denied");
    }



    @ExceptionHandler(AuthorizationDeniedException.class)
    public ResponseEntity<ErrorMessageFormat> handleSpringAuthDenied(
            AuthorizationDeniedException ex, WebRequest request) {

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                ErrorMessageFormat.builder()
                        .timeStamp(LocalDateTime.now())
                        .mess(List.of("Access denied: you don't have the required role"))
                        .desc(request.getDescription(false))
                        .build()
        );
    }

    @Override
    protected  ResponseEntity<Object> handleMethodArgumentNotValid(
        @SuppressWarnings("null") MethodArgumentNotValidException ex ,
        @SuppressWarnings("null") HttpHeaders headers,
        @SuppressWarnings("null") HttpStatusCode status,
        @SuppressWarnings("null") WebRequest request){
            
            List<String> message = ex.getBindingResult()
                                .getFieldErrors()
                                .stream()
                                .map(e -> e.getField()+"  "+e.getDefaultMessage())
                                .toList();

                               
            ErrorMessageFormat errorMessageFormat = ErrorMessageFormat.builder()
                                                        .timeStamp(LocalDateTime.now())
                                                        .mess(message)
                                                        .desc(request.getDescription(false))
                                                        .build();

            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorMessageFormat);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorMessageFormat> handleAll(
            Exception ex,
            WebRequest request) {

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                ErrorMessageFormat.builder()
                        .timeStamp(LocalDateTime.now())
                        .mess(List.of("Internal server error" + ex.getClass().getSimpleName()))
                        .desc(request.getDescription(false))
                        .build()
        );
    }

    @Override
    protected ResponseEntity<Object> handleHttpMessageNotReadable(
            @SuppressWarnings("null") HttpMessageNotReadableException ex,
            @SuppressWarnings("null") HttpHeaders headers,
            @SuppressWarnings("null") HttpStatusCode status,
            @SuppressWarnings("null") WebRequest request) {


        String message = ex.getMostSpecificCause().getMessage();

        ErrorMessageFormat error = ErrorMessageFormat.builder()
                .timeStamp(LocalDateTime.now())
                .mess(List.of(message))
                .desc(request.getDescription(false))
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }
}