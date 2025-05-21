import dotenv, { config } from 'dotenv';
dotenv.config();
console.log(config);
export default class WordChainGame {
    constructor(client) {
        this.rooms = {};
        this.client = client;
    }

    createRoom(roomName, maxPlayers, channelId) {
        if (this.rooms[roomName]) {
            return "이미 존재하는 방입니다! 🔴";
        }
        this.rooms[roomName] = {
            players: [],
            maxPlayers,
            gameStarted: false,
            words: [],
            currentTurnIndex: 0,
            turnTimer: null,
            penaltyList: [],
            turnInProgress: false,
            gameEnded: false,
            timeoutExpired: false,
            channelId: channelId
        };
        return `${roomName} 방이 생성되었습니다. 참가할 준비를 해주세요! 🏁`;
    }
    
    joinRoom(roomName, playerTag) {
        const room = this.rooms[roomName];
        if (!room) return "존재하지 않는 방입니다. ❌";
        if (room.players.includes(playerTag)) return `${playerTag}님은 이미 이 방에 참가 중입니다. 🚫`;
        if (room.players.length >= room.maxPlayers) return "방이 가득 찼습니다. 😢";
    
        room.players.push(playerTag);
        if (room.players.length === room.maxPlayers) {
            this.startGame(roomName);
            return "참가 완료! 게임이 시작됩니다. 🎮";
        }
        return `${playerTag}님이 ${roomName}에 참가했습니다. 🎉`;
    }
    
    startGame(roomName) {
        const room = this.rooms[roomName];
        if (!room) return;
    
        room.gameStarted = true;
        room.gameEnded = false;
        room.currentTurnIndex = 0;
        this.startTurnCountdown(roomName);
    
        return "게임이 시작되었습니다! 첫 번째 단어를 입력해 주세요. 🥳";
    }
    
    async inputWord(roomName, playerTag, word) {
        const room = this.rooms[roomName];
        if (!room?.gameStarted) return "게임이 시작되지 않았습니다. ⚠️";
        if (room.gameEnded) return "게임이 종료되었습니다. 🏁";
    
        const currentPlayerTag = room.players[room.currentTurnIndex];
        if (playerTag !== currentPlayerTag) {
            return `지금은 ${currentPlayerTag}님의 차례입니다. ⏳`;
        }
    
        if (room.turnInProgress) {
            return "처리 중입니다. 잠시만 기다려주세요. ⏳";
        }
    
        if (room.turnTimer) {
            clearInterval(room.turnTimer);
            room.turnTimer = null;
        }
    
        room.turnInProgress = true;
    
        // 단어 길이 체크
        const wordLength = Array.from(word).length;
        if (wordLength > 4) {
            room.turnInProgress = false;
            return "단어는 4글자 이하여야 합니다! 🚫";
        }
    
        const isValid = await this.isValidKoreanWord(word);
        console.log(`[단어 유효성 검사] '${word}' 유효성 결과: ${isValid}`);
        if (!isValid) {
            room.gameEnded = true;
            room.turnInProgress = false;
            this.notifyGameEnd(roomName, playerTag, word);  // 유효하지 않은 단어일 때
            return `${word}는 유효한 단어가 아닙니다! 벌칙을 받았으며 게임이 종료되었습니다. ❌⚠️`;
        }
    
        // 끝말잇기 규칙 검사
        const prevWords = room.words;
        if (prevWords.length > 0) {
            const lastWord = prevWords[prevWords.length - 1];
            const lastChar = lastWord[lastWord.length - 1];
            const firstChar = word[0];
            if (lastChar !== firstChar) {
                room.turnInProgress = false;
                return `끝말잇기 규칙에 맞지 않습니다! 이전 단어는 '${lastWord}'이고, 마지막 글자는 '${lastChar}'입니다. 🔄❌`;
            }
        }
    
        room.words.push(word);
        room.currentTurnIndex = (room.currentTurnIndex + 1) % room.players.length;
        room.turnInProgress = false;
    
        this.startTurnCountdown(roomName);
    
        console.log(`[입력한 플레이어] '${playerTag}' vs [현재 턴 플레이어] '${currentPlayerTag}'`);
        return `${playerTag}님이 ${word}를 입력했습니다. 다음 차례는 ${room.players[room.currentTurnIndex]}님입니다. 🔄`;
    }

    startTurnCountdown(roomName) {
        const room = this.rooms[roomName];
        if (!room) return;
    
        const currentPlayerTag = room.players[room.currentTurnIndex];
        const channel = this.client.channels.cache.get(room.channelId);
        if (!channel) {
            console.error("채널을 찾을 수 없습니다. ❌");
            return;
        }
    
        // 기존 타이머 클리어
        if (room.turnTimer) {
            clearTimeout(room.turnTimer);
        }
    
        room.timeoutExpired = false;
    
        // 메시지 한 번만 출력
        channel.send(`[⏳ 턴 시작] ${currentPlayerTag}님의 차례입니다. **15초 내에 단어를 입력하세요!** ⌛`);
    
        // 15초 후 시간 초과 처리
        room.turnTimer = setTimeout(() => {
            room.turnTimer = null;
            room.timeoutExpired = true;
            channel.send(`⏰ 시간 초과! ${currentPlayerTag}님은 단어를 입력하지 못했습니다. ❌`);
    
            this.applyPenalty(roomName, currentPlayerTag);
            room.gameEnded = true;
            this.notifyGameEnd(roomName, currentPlayerTag, "시간 초과");
    
            room.currentTurnIndex = (room.currentTurnIndex + 1) % room.players.length;
        }, 15000); // 15초
    }
    
    applyPenalty(roomName, playerTag) {
        const room = this.rooms[roomName];
        if (!room) return;
    
        room.penaltyList.push(playerTag);
        console.log(`[🚨 벌칙 발생] ${playerTag}님이 유효하지 않은 단어로 벌칙을 받았습니다.`);
    }
    
    notifyGameEnd(roomName, playerTag, invalidWord) {
        const room = this.rooms[roomName];
        if (!room) return;
    
        const channel = this.client.channels.cache.get(room.channelId);
        if (!channel) {
            console.error("채널을 찾을 수 없습니다. ❌");
            return;
        }
    
        let gameEndMessage;
        if (invalidWord === "시간 초과") {
            gameEndMessage = `${playerTag}님은 시간을 초과하여 단어를 입력하지 못했습니다. 게임이 종료되었습니다. 🏁`;
        } else {
            gameEndMessage = `${playerTag}님이 '${invalidWord}'로 유효하지 않은 단어를 제출하여 게임이 종료되었습니다. 🚫`;
        }
    
        channel.send(gameEndMessage);
    }

    async isValidKoreanWord(word) {
        const apiKey = process.env.API_KEY;  // 발급받은 키
        const encodedWord = encodeURIComponent(word);
        const apiUrl = `https://opendict.korean.go.kr/api/search?key=${apiKey}&target_type=search&req_type=xml&part=word&q=${encodedWord}`;

        try {
            const response = await fetch(apiUrl);
            const data = await response.text();
            console.log(`[OpenDict 응답 결과 for '${word}']: \n${data.substring(0, 300)}...`);
            return data.includes("<item>");
        } catch (error) {
            console.error("단어 유효성 검사 오류:", error);
            return false;
        }
    }

    getMaxPlayers(roomName) {
        const room = this.rooms[roomName];
        if (room) {
            return `이 방의 최대 인원은 ${room.maxPlayers}명입니다. 🎮`;
        } else {
            return "❌ 존재하지 않는 방입니다.";
        }
    }
}
