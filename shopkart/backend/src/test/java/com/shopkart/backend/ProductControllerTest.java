package com.shopkart.backend;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.util.Optional;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

@ExtendWith(MockitoExtension.class)
class ProductControllerTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CategoryRepository categoryRepository;

    private MockMvc mockMvc;
    private LocalValidatorFactoryBean validator;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Category category = new Category("beauty");

    @BeforeEach
    void setUp() {
        validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();
        mockMvc = MockMvcBuilders.standaloneSetup(
                        new ProductController(productRepository, categoryRepository))
                .setValidator(validator)
                .build();
    }

    @Test
    void createsProduct() throws Exception {
        when(categoryRepository.findByNameIgnoreCase("beauty")).thenReturn(Optional.of(category));
        when(productRepository.saveAndFlush(any(Product.class)))
                .thenAnswer(invocation -> {
                    Product product = invocation.getArgument(0);
                    ReflectionTestUtils.setField(product, "id", 12L);
                    return product;
                });

        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(productJson("Serum", "100.00", 8)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Serum"))
                .andExpect(jsonPath("$.category").value("beauty"));

        verify(productRepository).saveAndFlush(any(Product.class));
    }

    @Test
    void updatesProduct() throws Exception {
        Product product = new Product(null, "Old name", "Old description",
                BigDecimal.ONE, null, 1, category);
        ReflectionTestUtils.setField(product, "id", 7L);
        when(productRepository.findById(7L)).thenReturn(Optional.of(product));
        when(categoryRepository.findByNameIgnoreCase("beauty")).thenReturn(Optional.of(category));
        when(productRepository.saveAndFlush(product)).thenReturn(product);

        mockMvc.perform(put("/api/products/7")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(productJson("Updated serum", "125.50", 4)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Updated serum"))
                .andExpect(jsonPath("$.price").value(125.50));

        verify(productRepository).saveAndFlush(product);
    }

    @Test
    void deletesProduct() throws Exception {
        Product product = new Product(null, "Serum", "", BigDecimal.ONE, null, 1, category);
        ReflectionTestUtils.setField(product, "id", 7L);
        when(productRepository.findById(7L)).thenReturn(Optional.of(product));

        mockMvc.perform(delete("/api/products/7"))
                .andExpect(status().isNoContent());

        verify(productRepository).delete(product);
        verify(productRepository).flush();
    }

    @Test
    void returnsNotFoundWhenUpdatingMissingProduct() throws Exception {
        when(productRepository.findById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(put("/api/products/99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(productJson("Serum", "100.00", 8)))
                .andExpect(status().isNotFound());
    }

    @Test
    void rejectsUnknownCategory() throws Exception {
        when(categoryRepository.findByNameIgnoreCase("unknown")).thenReturn(Optional.empty());

        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ProductController.ProductRequest(
                                "Serum", "Product description", new BigDecimal("100.00"), null, 8, "unknown"))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejectsInvalidProductRequest() throws Exception {
        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":" ", "price":-1, "stockQuantity":-1, "category":""}
                                """))
                .andExpect(status().isBadRequest());
    }

    private String productJson(String name, String price, int stockQuantity) throws Exception {
        return objectMapper.writeValueAsString(new ProductController.ProductRequest(
                name,
                "Product description",
                new BigDecimal(price),
                "https://example.com/product.png",
                stockQuantity,
                "beauty"));
    }
}
