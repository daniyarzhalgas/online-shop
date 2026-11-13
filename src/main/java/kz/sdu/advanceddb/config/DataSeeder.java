package kz.sdu.advanceddb.config;

import kz.sdu.advanceddb.model.Interaction;
import kz.sdu.advanceddb.model.Interaction.InteractionType;
import kz.sdu.advanceddb.model.Product;
import kz.sdu.advanceddb.model.User;
import kz.sdu.advanceddb.repository.InteractionRepository;
import kz.sdu.advanceddb.repository.ProductRepository;
import kz.sdu.advanceddb.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final InteractionRepository interactionRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (!userRepository.existsByUsername("admin")) {
            seedBaseData();
        } else {
            log.info("Base data already seeded.");
        }
        if (!userRepository.existsByUsername("alice")) {
            seedExtendedData();
        } else {
            log.info("Extended collaborative-filtering data already seeded.");
        }
    }

    private void seedBaseData() {
        User admin = userRepository.save(User.builder()
                .username("admin").email("admin@shop.kz")
                .password(passwordEncoder.encode("admin123"))
                .firstName("Admin").lastName("Shop").role("ADMIN").build());

        User user1 = userRepository.save(User.builder()
                .username("daniyar").email("daniyar@shop.kz")
                .password(passwordEncoder.encode("password123"))
                .firstName("Daniyar").lastName("Zhalgasbekov")
                .phone("+7 701 234 5678").role("USER").build());

        User user2 = userRepository.save(User.builder()
                .username("aizat").email("aizat@shop.kz")
                .password(passwordEncoder.encode("password123"))
                .firstName("Aizat").lastName("Bekova")
                .phone("+7 702 345 6789").role("USER").build());

        List<Product> products = productRepository.saveAll(List.of(
                Product.builder().name("iPhone 15 Pro").description("Apple flagship smartphone with titanium frame").category("Electronics").price(new BigDecimal("849.99")).stock(50).brand("Apple").tags(List.of("phone", "apple", "smartphone")).averageRating(4.8).totalRatings(120).build(),
                Product.builder().name("Samsung Galaxy S24").description("Samsung flagship Android phone with AI features").category("Electronics").price(new BigDecimal("799.99")).stock(45).brand("Samsung").tags(List.of("phone", "samsung", "android")).averageRating(4.6).totalRatings(95).build(),
                Product.builder().name("MacBook Air M3").description("Ultra-thin Apple laptop with M3 chip").category("Laptops").price(new BigDecimal("1299.99")).stock(30).brand("Apple").tags(List.of("laptop", "apple", "macbook")).averageRating(4.9).totalRatings(60).build(),
                Product.builder().name("Dell XPS 15").description("Premium Windows laptop for professionals").category("Laptops").price(new BigDecimal("1199.99")).stock(25).brand("Dell").tags(List.of("laptop", "dell", "windows")).averageRating(4.5).totalRatings(45).build(),
                Product.builder().name("Sony WH-1000XM5").description("Industry-leading noise cancelling headphones").category("Audio").price(new BigDecimal("349.99")).stock(80).brand("Sony").tags(List.of("headphones", "sony", "noise-cancelling")).averageRating(4.7).totalRatings(200).build(),
                Product.builder().name("AirPods Pro 2").description("Apple wireless earbuds with active noise cancellation").category("Audio").price(new BigDecimal("249.99")).stock(100).brand("Apple").tags(List.of("earbuds", "apple", "wireless")).averageRating(4.6).totalRatings(300).build(),
                Product.builder().name("Nike Air Max 270").description("Lifestyle running shoes with Max Air cushioning").category("Footwear").price(new BigDecimal("129.99")).stock(200).brand("Nike").tags(List.of("shoes", "nike", "running")).averageRating(4.4).totalRatings(150).build(),
                Product.builder().name("Adidas Ultraboost 23").description("High-performance boost running shoes").category("Footwear").price(new BigDecimal("149.99")).stock(150).brand("Adidas").tags(List.of("shoes", "adidas", "running")).averageRating(4.5).totalRatings(130).build(),
                Product.builder().name("Samsung QLED 4K 55\"").description("55-inch 4K QLED Smart TV with Quantum HDR").category("TV").price(new BigDecimal("699.99")).stock(20).brand("Samsung").tags(List.of("tv", "samsung", "4k")).averageRating(4.6).totalRatings(80).build(),
                Product.builder().name("PlayStation 5").description("Sony next-gen gaming console with ultra-high speed SSD").category("Gaming").price(new BigDecimal("499.99")).stock(15).brand("Sony").tags(List.of("gaming", "sony", "console")).averageRating(4.8).totalRatings(250).build()
        ));

        interactionRepository.saveAll(List.of(
                Interaction.builder().userId(user1.getId()).productId(products.get(0).getId()).type(InteractionType.VIEW).build(),
                Interaction.builder().userId(user1.getId()).productId(products.get(0).getId()).type(InteractionType.RATING).rating(5.0).build(),
                Interaction.builder().userId(user1.getId()).productId(products.get(2).getId()).type(InteractionType.PURCHASE).build(),
                Interaction.builder().userId(user1.getId()).productId(products.get(4).getId()).type(InteractionType.VIEW).build(),
                Interaction.builder().userId(user1.getId()).productId(products.get(9).getId()).type(InteractionType.ADD_TO_CART).build(),
                Interaction.builder().userId(user2.getId()).productId(products.get(1).getId()).type(InteractionType.VIEW).build(),
                Interaction.builder().userId(user2.getId()).productId(products.get(5).getId()).type(InteractionType.PURCHASE).build(),
                Interaction.builder().userId(user2.getId()).productId(products.get(6).getId()).type(InteractionType.RATING).rating(4.0).build(),
                Interaction.builder().userId(user2.getId()).productId(products.get(8).getId()).type(InteractionType.VIEW).build(),
                Interaction.builder().userId(admin.getId()).productId(products.get(3).getId()).type(InteractionType.VIEW).build()
        ));

        log.info("Seeded base data: 3 users, {} products, 10 interactions.", products.size());
    }

    // Adds 5 more users with overlapping interactions for meaningful collaborative filtering
    private void seedExtendedData() {
        Map<String, String> pIds = productRepository.findAll().stream()
                .collect(Collectors.toMap(Product::getName, Product::getId, (a, b) -> a));

        String p0 = pIds.get("iPhone 15 Pro");
        String p1 = pIds.get("Samsung Galaxy S24");
        String p2 = pIds.get("MacBook Air M3");
        String p3 = pIds.get("Dell XPS 15");
        String p4 = pIds.get("Sony WH-1000XM5");
        String p5 = pIds.get("AirPods Pro 2");
        String p6 = pIds.get("Nike Air Max 270");
        String p7 = pIds.get("Adidas Ultraboost 23");
        String p8 = pIds.get("Samsung QLED 4K 55\"");
        String p9 = pIds.get("PlayStation 5");

        if (p0 == null || p1 == null || p2 == null) {
            log.warn("Base products not found, skipping extended seed.");
            return;
        }

        // alice overlaps with daniyar on p0, p2, p4 → will recommend p5 to daniyar
        User alice = userRepository.save(User.builder()
                .username("alice").email("alice@shop.kz")
                .password(passwordEncoder.encode("password123"))
                .firstName("Alice").lastName("Kim").role("USER").build());

        // bob overlaps with daniyar on p2, p9 → will recommend p3, p7 to daniyar
        User bob = userRepository.save(User.builder()
                .username("bob").email("bob@shop.kz")
                .password(passwordEncoder.encode("password123"))
                .firstName("Bob").lastName("Lee").role("USER").build());

        // charlie overlaps with aizat on p1, p6, p8 → will recommend p4 to aizat
        User charlie = userRepository.save(User.builder()
                .username("charlie").email("charlie@shop.kz")
                .password(passwordEncoder.encode("password123"))
                .firstName("Charlie").lastName("Park").role("USER").build());

        // diana overlaps with daniyar on p0, with aizat on p6
        User diana = userRepository.save(User.builder()
                .username("diana").email("diana@shop.kz")
                .password(passwordEncoder.encode("password123"))
                .firstName("Diana").lastName("Choi").role("USER").build());

        // emma overlaps with aizat on p5, p8
        User emma = userRepository.save(User.builder()
                .username("emma").email("emma@shop.kz")
                .password(passwordEncoder.encode("password123"))
                .firstName("Emma").lastName("Yoon").role("USER").build());

        interactionRepository.saveAll(List.of(
                Interaction.builder().userId(alice.getId()).productId(p0).type(InteractionType.RATING).rating(4.5).build(),
                Interaction.builder().userId(alice.getId()).productId(p2).type(InteractionType.PURCHASE).build(),
                Interaction.builder().userId(alice.getId()).productId(p4).type(InteractionType.VIEW).build(),
                Interaction.builder().userId(alice.getId()).productId(p5).type(InteractionType.ADD_TO_CART).build(),

                Interaction.builder().userId(bob.getId()).productId(p2).type(InteractionType.RATING).rating(5.0).build(),
                Interaction.builder().userId(bob.getId()).productId(p3).type(InteractionType.PURCHASE).build(),
                Interaction.builder().userId(bob.getId()).productId(p7).type(InteractionType.RATING).rating(4.0).build(),
                Interaction.builder().userId(bob.getId()).productId(p9).type(InteractionType.VIEW).build(),

                Interaction.builder().userId(charlie.getId()).productId(p1).type(InteractionType.PURCHASE).build(),
                Interaction.builder().userId(charlie.getId()).productId(p4).type(InteractionType.VIEW).build(),
                Interaction.builder().userId(charlie.getId()).productId(p6).type(InteractionType.ADD_TO_CART).build(),
                Interaction.builder().userId(charlie.getId()).productId(p8).type(InteractionType.VIEW).build(),

                Interaction.builder().userId(diana.getId()).productId(p0).type(InteractionType.VIEW).build(),
                Interaction.builder().userId(diana.getId()).productId(p3).type(InteractionType.ADD_TO_CART).build(),
                Interaction.builder().userId(diana.getId()).productId(p6).type(InteractionType.PURCHASE).build(),
                Interaction.builder().userId(diana.getId()).productId(p7).type(InteractionType.RATING).rating(3.5).build(),

                Interaction.builder().userId(emma.getId()).productId(p1).type(InteractionType.ADD_TO_CART).build(),
                Interaction.builder().userId(emma.getId()).productId(p4).type(InteractionType.RATING).rating(5.0).build(),
                Interaction.builder().userId(emma.getId()).productId(p5).type(InteractionType.VIEW).build(),
                Interaction.builder().userId(emma.getId()).productId(p8).type(InteractionType.PURCHASE).build()
        ));

        log.info("Seeded extended data: 5 users, 20 interactions for collaborative filtering.");
    }
}
