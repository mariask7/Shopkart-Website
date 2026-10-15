package com.shopkart.backend;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(ProductController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtService.class})
@TestPropertySource(properties = {
        "shopkart.jwt.secret=unit-test-signing-secret-with-more-than-32-bytes",
        "shopkart.jwt.expiration-ms=3600000"
})
class ProductSecurityTest {

    @MockitoBean
    private ProductRepository productRepository;

    @MockitoBean
    private CategoryRepository categoryRepository;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void allowsPublicProductReads() throws Exception {
        when(productRepository.findAllByOrderByIdAsc()).thenReturn(List.of());

        mockMvc.perform(get("/api/products?limit=0"))
                .andExpect(status().isOk());
    }

    @Test
    void rejectsProductWritesWithoutJwt() throws Exception {
        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(productJson()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void acceptsProductWritesWithJwt() throws Exception {
        Category category = new Category("beauty");
        when(categoryRepository.findByNameIgnoreCase("beauty")).thenReturn(Optional.of(category));
        when(productRepository.saveAndFlush(any(Product.class)))
                .thenAnswer(invocation -> {
                    Product product = invocation.getArgument(0);
                    ReflectionTestUtils.setField(product, "id", 12L);
                    return product;
                });

        User user = new User("Test User", "test@example.com", "hash");
        ReflectionTestUtils.setField(user, "id", 1L);
        String token = jwtService.createToken(user);

        mockMvc.perform(post("/api/products")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(productJson()))
                .andExpect(status().isCreated());
    }

    private String productJson() throws Exception {
        return objectMapper.writeValueAsString(new ProductController.ProductRequest(
                "Serum",
                "Product description",
                new BigDecimal("100.00"),
                "https://example.com/product.png",
                8,
                "beauty"));
    }
}
