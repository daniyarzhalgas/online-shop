package kz.sdu.advanceddb.controller;

import jakarta.validation.Valid;
import kz.sdu.advanceddb.dto.InteractionRequest;
import kz.sdu.advanceddb.model.Interaction;
import kz.sdu.advanceddb.model.User;
import kz.sdu.advanceddb.service.InteractionService;
import kz.sdu.advanceddb.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/interactions")
@RequiredArgsConstructor
public class InteractionController {

    private final InteractionService interactionService;
    private final UserService userService;

    @PostMapping
    public ResponseEntity<Interaction> record(
            @Valid @RequestBody InteractionRequest request,
            Authentication authentication) {
        User user = userService.getByUsername(authentication.getName());
        return ResponseEntity.ok(interactionService.record(user.getId(), request));
    }

    @GetMapping("/history")
    public ResponseEntity<List<Interaction>> history(Authentication authentication) {
        User user = userService.getByUsername(authentication.getName());
        return ResponseEntity.ok(interactionService.getHistory(user.getId()));
    }
}
