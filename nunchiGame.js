export default class NunchiGame {
    constructor(client) {
        this.rooms = {};
        this.client = client;
    }

    createRoom(roomName, maxPlayers) {
        if (this.rooms[roomName]) {
            return "❌ 이미 존재하는 방입니다!"; // 방이 이미 있을 경우
        }
        this.rooms[roomName] = {
            players: [], // 참가자 리스트
            maxPlayers: maxPlayers,
            gameStarted: false,
            inputs: [], // { player, number, time }
            currentPlayerIndex: 0, // 현재 입력할 플레이어 인덱스
            timer: null, // 타이머 상태
            countdownFinished: false, // 카운트다운 완료 여부
        };
        return `${roomName} 방이 생성되었습니다. 참가할 준비를 해주세요! 🎮`; // 방 생성 완료
    }
    
    joinRoom(roomName, player, channelId) {
        const room = this.rooms[roomName];
        if (!room) {
            return "❌ 존재하지 않는 방입니다."; // 존재하지 않는 방
        }
        if (room.players.length >= room.maxPlayers) {
            return "🚫 방이 가득 찼습니다."; // 방 가득 찬 경우
        }
        room.players.push(player);
    
        // 채널 ID 저장
        room.channelId = channelId; // 추가된 부분
    
        if (room.players.length === room.maxPlayers) {
            this.startGame(roomName);
            return "✔️ 참가 완료! 게임이 시작됩니다."; // 게임 시작
        }
        return `${player}님이 ${roomName}에 참가했습니다. 🎉`; // 참가 완료
    }
    
    startGame(roomName) {
        const room = this.rooms[roomName];
        if (!room) return;
    
        room.gameStarted = true;
        room.currentPlayerIndex = 0; // 게임 시작 시 첫 번째 플레이어부터
        room.inputs = []; // 입력 기록 초기화
        room.countdownFinished = false; // 카운트다운 상태 초기화
    
        // 카운트다운을 한 번만 시작하게 처리
        if (!room.countdownStarted) {
            room.countdownStarted = true; // 카운트다운 시작 플래그 설정
            this.startCountdown(roomName); // 게임 시작 시 카운트다운 시작
        }
    }
    
    async startCountdown(roomName) {
        const room = this.rooms[roomName];
        if (!room || room.countdownFinished) return;
    
        // 채널 ID가 없다면 종료
        if (!room.channelId) {
            console.error('채널 ID가 없습니다. 카운트다운을 시작할 수 없습니다.');
            return;
        }
    
        const channel = await this.client.channels.fetch(room.channelId);
        if (!channel) {
            console.error('유효한 채널을 찾을 수 없습니다.');
            return;
        }
    
        let timeLeft = 10;
        room.timer = setInterval(() => {
            if (timeLeft > 0) {
                channel.send(`${roomName} 방에서 ${timeLeft}초 남았습니다. ⏳`); // 카운트다운 진행
                timeLeft--;
            } else {
                clearInterval(room.timer);
                room.countdownFinished = true;
                channel.send(`${roomName} 방에서 카운트다운 완료! 게임을 시작합니다. 🚀`); // 카운트다운 완료
            }
        }, 1000);
    }
    
    handleTurnTimeout(roomName) {
        const room = this.rooms[roomName];
        const currentPlayer = room.players[room.currentPlayerIndex];
        console.log(`${currentPlayer}이(가) 10초 내에 입력하지 않았습니다! 벌칙 처리 🚨`);
    
        // 벌칙 처리 로직 추가
        this.penalty(roomName, currentPlayer);
    
        // 차례를 넘기기
        room.currentPlayerIndex = (room.currentPlayerIndex + 1) % room.players.length;
    
        // 카운트다운 비활성화 (차례가 넘어갈 때마다 카운트다운을 중지)
        room.countdownFinished = false;
    }

    penalty(roomName, player) {
        const room = this.rooms[roomName];
        // 벌칙 처리 로직 예시 (벌칙 점수 차감, 게임 종료 등)
        console.log(`${player}님에게 벌칙을 부여합니다! 🚨`);
        // 예: 점수 차감, 게임 종료 등
        // 여기에 추가적인 벌칙 처리 코드 작성
    }
    
    inputNumber(roomName, player, number) {
        const room = this.rooms[roomName];
        if (!room?.gameStarted) {
            return "❌ 게임이 시작되지 않았습니다.";
        }
    
        if (!room.countdownFinished) {
            return "⏳ 10초 카운트가 완료된 후 숫자를 입력할 수 있습니다.";
        }
    
        // 이미 입력한 사람은 또 입력 못함
        if (room.inputs.find(input => input.player === player)) {
            return `🚫 ${player}님은 이미 입력하셨습니다.`;
        }
    
        const nowNano = process.hrtime.bigint();
    
        // 중복 숫자 검사
        const existingInput = room.inputs.find(input => input.number === number);
        if (existingInput) {
            room.penaltyPlayer = player;
            room.gameStarted = false;
            return `${player}님이 중복된 숫자 ${number}를 입력했습니다. ❌ 벌칙 당첨!\n(입력 시각: ${nowNano}ns, 기존: ${existingInput.nanoTime}ns)`;
        }
    
        // 순서 검사
        const expectedNumber = room.inputs.length + 1;
        if (number !== expectedNumber) {
            room.penaltyPlayer = player;
            room.gameStarted = false;
            return `${player}님이 ${expectedNumber}이 아닌 ${number}을(를) 입력했습니다. ❌ 순서 오류! 벌칙 당첨!\n(입력 시각: ${nowNano}ns)`;
        }
    
        room.inputs.push({ player, number, time: Date.now(), nanoTime: nowNano });
    
        // 모두 입력했는지 확인
        if (room.inputs.length === room.players.length) {
            room.gameStarted = false;
            const lastPlayer = room.inputs[room.inputs.length - 1].player;
            return `${player}님이 ${number}을(를) 입력했습니다. 🎯 모든 입력 완료!\n마지막 입력자 ${lastPlayer}님이 벌칙 당첨입니다!`;
        }
    
        return `${player}님이 ${number}를 입력했습니다. (입력 시각: ${nowNano}ns)\n✅ 현재 ${room.inputs.length}/${room.players.length}명 입력 완료`;
    }

}

