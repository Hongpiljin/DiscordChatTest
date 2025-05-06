package com.discordbot.dto;

import java.time.LocalDateTime;

public class PlayerInput {
    public int number;
    public LocalDateTime timestamp;

    public PlayerInput(int number, LocalDateTime timestamp) {
        this.number = number;
        this.timestamp = timestamp;
    }
}
