package com.shopkart.backend;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import com.fasterxml.jackson.databind.JsonNode;

@Component
@ConditionalOnProperty(name = "shopkart.catalog.import-on-start", havingValue = "true")
public class CatalogImportRunner implements CommandLineRunner {

    private static final Logger LOGGER = LoggerFactory.getLogger(CatalogImportRunner.class);
    private static final List<String> CATEGORIES = List.of(
            "beauty",
            "fragrances",
            "mens-shirts",
            "mens-shoes",
            "mens-watches",
            "womens-dresses",
            "womens-shoes",
            "womens-bags",
            "womens-jewellery",
            "womens-watches",
            "sunglasses");

    private final RestClient catalogClient;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public CatalogImportRunner(
            RestClient.Builder restClientBuilder,
            CategoryRepository categoryRepository,
            ProductRepository productRepository) {
        this.catalogClient = restClientBuilder.baseUrl("https://dummyjson.com").build();
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    @Override
    public void run(String... args) {
        if (productRepository.existsBySourceIdIsNotNull()) {
            LOGGER.info("ShopKart catalog is already imported; skipping catalog import.");
            return;
        }

        try {
            JsonNode response = catalogClient.get()
                    .uri("/products?limit=0")
                    .retrieve()
                    .body(JsonNode.class);
            int imported = importProducts(response.path("products"));
            LOGGER.info("Imported {} products with image URLs into MySQL.", imported);
        } catch (RestClientException exception) {
            LOGGER.warn("Could not import the online catalog; ShopKart will use existing database products.", exception);
        }
    }

    @Transactional
    int importProducts(JsonNode products) {
        Map<String, Category> categories = new HashMap<>();
        int imported = 0;

        for (JsonNode item : products) {
            String categoryName = item.path("category").asText();
            if (!CATEGORIES.contains(categoryName)) {
                continue;
            }

            Category category = categories.computeIfAbsent(categoryName, name ->
                    categoryRepository.findByNameIgnoreCase(name)
                            .orElseGet(() -> categoryRepository.save(new Category(name))));
            long sourceId = item.path("id").asLong();
            String imageUrl = item.path("thumbnail").asText();
            BigDecimal priceInRupees = BigDecimal.valueOf(item.path("price").asDouble())
                    .multiply(BigDecimal.valueOf(83))
                    .setScale(2, RoundingMode.HALF_UP);

            Product product = productRepository.findBySourceId(sourceId)
                    .orElseGet(() -> new Product(sourceId, "", "", BigDecimal.ZERO, null, 0, category));
            product.updateFromCatalog(
                    item.path("title").asText(),
                    item.path("description").asText(),
                    priceInRupees,
                    imageUrl,
                    item.path("stock").asInt(),
                    category);
            productRepository.save(product);
            imported++;
        }

        return imported;
    }
}