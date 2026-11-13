package kz.sdu.advanceddb.repository;

import kz.sdu.advanceddb.model.Interaction;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface InteractionRepository extends MongoRepository<Interaction, String> {

    List<Interaction> findByUserId(String userId);

    List<Interaction> findByUserIdOrderByCreatedAtDesc(String userId);

    List<Interaction> findByProductId(String productId);

    List<Interaction> findByUserIdAndType(String userId, Interaction.InteractionType type);
}
