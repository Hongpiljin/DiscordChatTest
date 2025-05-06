package com.discordbot.dto;

import java.util.*;
import java.util.concurrent.*;

public class NunchiGamedto {
    // 공통 게임 정보
    public boolean inProgress;             // 게임 진행 중 여부
    public int maxPlayers;                 // 최대 인원
    public List<String> players;           // 플레이어 목록 (userId)
    public Map<String, String> nicknames;  // 사용자 ID -> 닉네임
    public int currentTurn;                // 현재 차례 (인덱스)
    public long lastActionTime;            // 마지막 액션 시간
    public long timeoutMillis;             // 타임아웃 시간 (ms)
    public ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
    public ScheduledFuture<?> timeoutTask;  // 타임아웃 Task

   // 눈치 게임 관련
public int targetNumber;                             // 목표 숫자
public Map<String, PlayerInput> playersTurn;         // userId -> 입력 정보
public String winner;                                // 당첨자
public boolean gameOver;                             // 게임 종료 여부
    // 끝말잇기 관련
    public Set<String> usedWords;                        // 사용된 단어 목록
    public String lastWord;                              // 마지막 입력된 단어
    public transient ScheduledExecutorService countdownScheduler; // 끝말잇기용 카운트다운 스케줄러
    public transient boolean isCountingDown = false;              // 중복 방지 플래그

    // 추가된 필드: 사용자 입력 가능 여부 (끝말잇기, 눈치게임)
    public boolean acceptingInputs = false;  // 입력을 받을 준비가 되었는지 여부

    // 생성자
    public NunchiGamedto() {
        this.players = new ArrayList<>();
        this.nicknames = new HashMap<>();
        this.usedWords = new HashSet<>();
        this.playersTurn = new HashMap<>();
        this.winner = null;
        this.gameOver = false;
        this.lastWord = null;
    }
}
