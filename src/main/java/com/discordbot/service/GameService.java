package com.discordbot.service;

import org.springframework.stereotype.Service;
import com.discordbot.dto.NunchiGamedto;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;


@Service
public class GameService {

    private Map<String, NunchiGamedto> games = new HashMap<>();
    private Map<String, NunchiGamedto> wordChainGames = new HashMap<>();

    // 한국어 단어 유효성 검사
    public boolean isValidKoreanWord(String word) {
        String apiKey = "3DBDC94FAAE9284C9593688842A7A761";  // 발급받은 키
        String encodedWord = URLEncoder.encode(word, StandardCharsets.UTF_8);
        String apiUrl = "https://opendict.korean.go.kr/api/search"
                + "?key=" + apiKey
                + "&target_type=search"
                + "&req_type=xml"
                + "&part=word"
                + "&q=" + encodedWord;

        try {
            URL url = new URL(apiUrl);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(5000);
            connection.setReadTimeout(5000);

            int responseCode = connection.getResponseCode();
            if (responseCode == HttpURLConnection.HTTP_OK) {
                BufferedReader in = new BufferedReader(new InputStreamReader(connection.getInputStream(), StandardCharsets.UTF_8));
                String inputLine;
                StringBuilder content = new StringBuilder();
                while ((inputLine = in.readLine()) != null) {
                    content.append(inputLine);
                }
                in.close();

                String response = content.toString();
                return response.contains("<word>");  // word 태그 존재 여부로 유효성 판단
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    // 눈치게임 생성
    public String createNunchiGame(String gameName, int maxPlayers) {
        if (games.containsKey(gameName)) {
            return "이미 해당 이름의 눈치게임이 존재합니다. 다른 방 이름을 선택해 주세요. 🌷";
        }

        NunchiGamedto game = new NunchiGamedto();
        game.maxPlayers = maxPlayers;
        game.players = new ArrayList<>();
        game.inProgress = false;
        game.currentTurn = 0;
        game.targetNumber = (maxPlayers == 1) ? 1 : 5;

        games.put(gameName, game);
        return "눈치게임이 생성되었습니다 🌸 `/눈치게임참가`로 참가하세요! (인원수: " + maxPlayers + ") 🎉";
    }

    // 끝말잇기 게임 생성
    public String createWordChainGame(String gameName, int maxPlayers) {
        if (wordChainGames.containsKey(gameName)) {
            return "이미 해당 이름의 끝말잇기 게임이 존재합니다. 다른 방 이름을 선택해 주세요. 🌷";
        }

        NunchiGamedto wordChainGame = new NunchiGamedto();
        wordChainGame.maxPlayers = maxPlayers;
        wordChainGame.players = new ArrayList<>();
        wordChainGame.usedWords = new HashSet<>();
        wordChainGame.lastWord = "";
        wordChainGame.inProgress = false;
        wordChainGame.acceptingInputs = false;
        wordChainGame.currentTurn = 0;

        wordChainGames.put(gameName, wordChainGame);
        return "끝말잇기 게임이 생성되었습니다 🌸 `/끝말잇기참가`로 참가하세요! (인원수: " + maxPlayers + ") 🎉";
    }

    // 끝말잇기 단어 입력 처리
    public String handleInputWord(String gameName, String username, String inputWord) {
        NunchiGamedto wordChainGame = wordChainGames.get(gameName);

        if (wordChainGame == null || !wordChainGame.inProgress || !wordChainGame.acceptingInputs) {
            return "진행 중인 끝말잇기 게임이 없습니다. 🚫";
        }

        // 단어 길이 제한
        if (inputWord.length() > 4) {
            return "단어는 4글자 이하만 입력 가능합니다! 다시 시도해주세요. 🛑";
        }

        // 중복 단어 확인
        if (wordChainGame.usedWords.contains(inputWord)) {
            wordChainGame.inProgress = false;
            wordChainGame.acceptingInputs = false;  // 더 이상 입력 받지 않음
            return "이미 사용된 단어입니다! " + username + "님은 탈락입니다💥";
        }

        // 유효한 단어 확인
        if (!isValidKoreanWord(inputWord)) {
            wordChainGame.inProgress = false;
            wordChainGame.acceptingInputs = false;  // 더 이상 입력 받지 않음
            return inputWord + "는 유효한 한국어 단어가 아닙니다! " + username + "님은 탈락입니다💥";
        }

        // 턴 확인
        if (!username.equals(wordChainGame.players.get(wordChainGame.currentTurn))) {
            return "지금은 " + wordChainGame.players.get(wordChainGame.currentTurn) + "님의 차례입니다. ⏳";
        }

        // 글자 규칙 확인
        if (!wordChainGame.usedWords.isEmpty()) {
            String lastWord = wordChainGame.lastWord;
            char lastChar = lastWord.charAt(lastWord.length() - 1);
            char firstChar = inputWord.charAt(0);

            if (lastChar != firstChar) {
                wordChainGame.inProgress = false;
                wordChainGame.acceptingInputs = false;  // 더 이상 입력 받지 않음
                return "이전 단어는 '" + lastWord + "'입니다. '" + lastChar + "'로 시작하는 단어를 입력해야 합니다. " + username + "님 탈락💥";
            }
        }

        // 단어 등록
        wordChainGame.usedWords.add(inputWord);
        wordChainGame.lastWord = inputWord;

        // 다음 턴으로 넘기기
        wordChainGame.currentTurn = (wordChainGame.currentTurn + 1) % wordChainGame.maxPlayers;
        String nextPlayer = wordChainGame.players.get(wordChainGame.currentTurn);

        // 카운트다운 종료 및 새 카운트다운 시작
        if (wordChainGame.countdownScheduler != null && !wordChainGame.countdownScheduler.isShutdown()) {
            wordChainGame.countdownScheduler.shutdownNow();
        }
        wordChainGame.isCountingDown = false;

        startWordChainCountdown(gameName);  // 카운트다운 시작

        return username + "님이 '" + inputWord + "'를 입력했습니다! 👍 이제 " + nextPlayer + "님의 차례입니다! 🔄";
    }

    // 카운트다운 시작 (ScheduledExecutorService 사용)
    public void startWordChainCountdown(String gameName) {
        NunchiGamedto game = wordChainGames.get(gameName);
        if (game == null || game.isCountingDown) return;

        game.isCountingDown = true;
        game.countdownScheduler = Executors.newSingleThreadScheduledExecutor();
        AtomicInteger countdownTime = new AtomicInteger(10);  // 10초로 카운트다운 시간 설정

        game.countdownScheduler.scheduleAtFixedRate(() -> {
            int timeLeft = countdownTime.getAndDecrement();
            if (timeLeft <= 0) {
                game.countdownScheduler.shutdown();
                game.isCountingDown = false;
                game.acceptingInputs = true;  // 카운트다운 종료 후 입력 받기 시작
            }
        }, 0, 1, TimeUnit.SECONDS);
    }
}