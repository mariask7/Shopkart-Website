package com.shopkart.backend;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class RootController {

    @GetMapping("/")
    public Map<String, String> getStatus() {
        return Map.of(
                "application", "ShopKart backend",
                "status", "running",
                "api", "/api/products?limit=1");
    }
}
