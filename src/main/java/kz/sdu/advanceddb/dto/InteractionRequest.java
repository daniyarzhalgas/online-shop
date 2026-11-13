package kz.sdu.advanceddb.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import kz.sdu.advanceddb.model.Interaction;
import lombok.Data;

@Data
public class InteractionRequest {

    @NotBlank
    private String productId;

    @NotNull
    private Interaction.InteractionType type;

    @Min(1) @Max(5)
    private Double rating;
}
