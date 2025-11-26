package crm.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/tasks")
public class TaskController {

    @GetMapping
    public ResponseEntity<List<Object>> listTasks() {
        // Placeholder endpoint to unblock frontend; returns empty list
        return ResponseEntity.ok(Collections.emptyList());
    }
}