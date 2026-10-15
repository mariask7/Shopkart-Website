package com.shopkart.backend;

import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class ProductController {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public ProductController(ProductRepository productRepository, CategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    @GetMapping("/products")
    public ProductList getProducts(@RequestParam(defaultValue = "0") int limit) {
        return toProductList(productRepository.findAllByOrderByIdAsc(), limit);
    }

    @GetMapping("/products/search")
    public ProductList searchProducts(@RequestParam String q) {
        if (q.isBlank()) {
            return getProducts(0);
        }
        return toProductList(
                productRepository.findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(
                        q.trim(), q.trim()),
                0);
    }

    @GetMapping("/products/category/{category}")
    public ProductList getProductsByCategory(@PathVariable String category) {
        return toProductList(
            productRepository.findByCategory_NameIgnoreCase(category),
                0);
    }

    @GetMapping("/products/{id}")
    public ProductView getProduct(@PathVariable long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
        return toProductView(product);
    }

    @PostMapping("/products")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public ProductView createProduct(@Valid @RequestBody ProductRequest request) {
        Category category = findCategory(request.category());
        Product product = new Product(
                null,
                request.name().trim(),
                request.description(),
                request.price(),
                request.imageUrl(),
                request.stockQuantity(),
                category);
        return toProductView(productRepository.saveAndFlush(product));
    }

    @PutMapping("/products/{id}")
    @Transactional
    public ProductView updateProduct(@PathVariable long id, @Valid @RequestBody ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
        Category category = findCategory(request.category());
        product.updateFromCatalog(
                request.name().trim(),
                request.description(),
                request.price(),
                request.imageUrl(),
                request.stockQuantity(),
                category);
        return toProductView(productRepository.saveAndFlush(product));
    }

    @DeleteMapping("/products/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void deleteProduct(@PathVariable long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
        try {
            productRepository.delete(product);
            productRepository.flush();
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Product cannot be deleted because it is referenced by other records",
                    exception);
        }
    }

    private Category findCategory(String categoryName) {
        return categoryRepository.findByNameIgnoreCase(categoryName.trim())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Category does not exist: " + categoryName));
    }

    private ProductList toProductList(List<Product> products, int limit) {
        if (limit < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "limit cannot be negative");
        }
        List<Product> selected = limit == 0 ? products : products.stream().limit(limit).toList();
        return new ProductList(
                selected.stream().map(ProductController::toProductView).toList(),
                products.size(),
                0,
                selected.size());
    }

    private static ProductView toProductView(Product product) {
        String imageUrl = product.getImageUrl();
        String category = product.getCategory().getName().toLowerCase().replace(' ', '-');
        return new ProductView(
                product.getId(),
                product.getName(),
                product.getDescription(),
                category,
                product.getPrice(),
                0,
                0,
                product.getStockQuantity(),
                imageUrl,
                imageUrl == null || imageUrl.isBlank() ? List.of() : List.of(imageUrl),
                category,
                "",
                "Free delivery",
                List.of());
    }

    public record ProductRequest(
            @NotBlank @Size(max = 255) String name,
            @Size(max = 16000) String description,
            @NotNull @DecimalMin("0.00") @Digits(integer = 8, fraction = 2) BigDecimal price,
            @Size(max = 2048) String imageUrl,
            @NotNull @Min(0) Integer stockQuantity,
            @NotBlank @Size(max = 150) String category) {
    }

    public record ProductList(List<ProductView> products, long total, int skip, int limit) {
    }

    public record ProductView(
            long id,
            String title,
            String description,
            String category,
            BigDecimal price,
            double discountPercentage,
            double rating,
            int stock,
            String thumbnail,
            List<String> images,
            String brand,
            String warrantyInformation,
            String shippingInformation,
            List<Object> reviews) {
    }

}
