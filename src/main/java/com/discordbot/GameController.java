package com.discordbot; 
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.discordbot.dto.NunchiGamedto;
import com.discordbot.service.GameService;

import java.util.*;

@RestController
@RequestMapping("/game")
public class GameController {

    private final GameService gameService;  // GameService 주입

    @Autowired
    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    private Map<String, NunchiGamedto> games = new HashMap<>();  // 눈치게임 방 정보
    private Map<String, NunchiGamedto> wordChainGames = new HashMap<>();  // 끝말잇기 게임 방 정보

    // 눈치게임 생성 API
    @PostMapping("/nunchiGame/create")
    public String createNunchiGame(@RequestParam String gameName, @RequestParam int maxPlayers) {
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

    // 눈치게임 참가 API
    @PostMapping("/nunchiGame/join")
    public String joinNunchiGame(@RequestParam String gameName, @RequestParam String username) {
        NunchiGamedto game = games.get(gameName);
        
        if (game == null) {
            return "해당 눈치게임을 찾을 수 없습니다. 게임 이름을 확인해 주세요. 🚫";
        }

        if (game.players.size() >= game.maxPlayers) {
            return "참가 인원이 초과되었습니다. 다른 방을 선택하세요. 🛑";
        }

        if (game.players.contains(username)) {
            return "이미 참가한 사용자입니다! 다른 게임에 참가해 주세요. 🔄";
        }

        game.players.add(username);
        return username + "님이 눈치게임에 참가했습니다! 🎉";
    }

    // 끝말잇기 게임 생성 API
    @PostMapping("/wordChainGame/create")
    public String createWordChainGame(@RequestParam String gameName, @RequestParam int maxPlayers) {
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

    // 끝말잇기 게임 참가 API
    @PostMapping("/wordChainGame/join")
    public String joinWordChainGame(@RequestParam String gameName, @RequestParam String username) {
        NunchiGamedto wordChainGame = wordChainGames.get(gameName);
        
        if (wordChainGame == null) {
            return "해당 끝말잇기 게임을 찾을 수 없습니다. 게임 이름을 확인해 주세요. 🚫";
        }

        if (wordChainGame.players.size() >= wordChainGame.maxPlayers) {
            return "참가 인원이 초과되었습니다. 다른 방을 선택하세요. 🛑";
        }

        if (wordChainGame.players.contains(username)) {
            return "이미 참가한 사용자입니다! 다른 게임에 참가해 주세요. 🔄";
        }

        wordChainGame.players.add(username);
        return username + "님이 끝말잇기 게임에 참가했습니다! 🎉";
    }

    // 끝말잇기 단어 입력 API
    @PostMapping("/wordChainGame/{gameName}/inputWord")
    public String handleInputWord(
            @PathVariable String gameName, 
            @RequestParam String username, 
            @RequestParam String inputWord) {
        
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
        if (!gameService.isValidKoreanWord(inputWord)) {  // 서비스 메서드 호출
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

        gameService.startWordChainCountdown(gameName);  // 서비스 메서드 호출

        return username + "님이 '" + inputWord + "'를 입력했습니다! 👍 이제 " + nextPlayer + "님의 차례입니다! 🔄";
    }
}
