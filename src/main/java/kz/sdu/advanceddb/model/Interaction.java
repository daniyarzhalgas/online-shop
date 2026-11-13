package kz.sdu.advanceddb.model;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "interactions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Interaction {

    @Id
    private String id;

    @Indexed
    private String userId;

    @Indexed
    private String productId;

    private InteractionType type;

    private Double rating;

    @CreatedDate
    private LocalDateTime createdAt;

    public enum InteractionType {
        VIEW, RATING, PURCHASE, ADD_TO_CART
    }
}
