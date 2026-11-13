package kz.sdu.advanceddb.service;

import kz.sdu.advanceddb.dto.InteractionRequest;
import kz.sdu.advanceddb.model.Interaction;
import kz.sdu.advanceddb.repository.InteractionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InteractionService {

    private final InteractionRepository interactionRepository;
    private final ProductService productService;
    private final RecommendationService recommendationService;

    public Interaction record(String userId, InteractionRequest req) {
        Interaction interaction = Interaction.builder()
                .userId(userId)
                .productId(req.getProductId())
                .type(req.getType())
                .rating(req.getRating())
                .build();

        Interaction saved = interactionRepository.save(interaction);

        if (req.getType() == Interaction.InteractionType.RATING && req.getRating() != null) {
            productService.applyRating(req.getProductId(), req.getRating());
        }

        recommendationService.evictCache(userId);

        return saved;
    }

    public List<Interaction> getHistory(String userId) {
        return interactionRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
}
