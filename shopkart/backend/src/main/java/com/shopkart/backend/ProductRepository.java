package com.shopkart.backend;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findAllByOrderByIdAsc();

    List<Product> findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(String name, String description);

    List<Product> findByCategory_NameIgnoreCase(String categoryName);

    java.util.Optional<Product> findBySourceId(Long sourceId);

    boolean existsBySourceIdIsNotNull();
}