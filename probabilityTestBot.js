import pkg from 'discord.js';  // discord.js를 기본값으로 가져옴
const { EmbedBuilder } = pkg;

export default class ProbabilityTestGame {
  constructor(client) {
    this.client = client;
    this.itemProbabilities = {
      "고급": { probability: 0.9,},  
      "고급★": { probability: 0.85,}, 
      "레어★": { probability: 0.8,}, 
      "레어★★": { probability: 0.8,}, 
      "레어★★★": { probability: 0.5,}, 
      "엘리트 ★★★★": { probability: 0.4,},  
      "에픽★★★★★": { probability: 0.1,},  
    };
    this.maxTrials = Infinity;
    this.trialCount = 0;
    this.successCount = 0;
    this.failureCount = 0;
    this.targetChannel = null;
    this.awaitingInput = false;  // 사용자 입력을 기다리고 있는지 체크
  }

  async start(channelId) {
    this.targetChannel = await this.client.channels.fetch(channelId);
    if (!this.targetChannel) {
      console.error("❌ 채널을 찾을 수 없습니다.");
      return;
    }
  
    const gradeListEmbed = new EmbedBuilder()
      .setColor('#2ecc71')  // 기본 색상 설정 (예시로 초록색)
      .setDescription(
        Object.keys(this.itemProbabilities)
          .map(item => {
            const { color } = this.itemProbabilities[item];
            return `**${item}** (${(this.itemProbabilities[item].probability * 100).toFixed(2)}%)`;  // 색상 코드 텍스트로 출력
          })
          .join("\n")
      );

    await this.sendMessage({ embeds: [gradeListEmbed] });

    this.promptUser();
  }

  async sendMessage(content) {
    if (this.targetChannel) {
      await this.targetChannel.send(content);
    } else {
      console.log("[콘솔 출력] " + content);
    }
  }

  // 사용자로부터 입력 받기 위한 메시지를 디스코드 채널에 전송
  async promptUser() {
    if (this.trialCount >= this.maxTrials) {
      this.endTest();
      return;
    }

    await this.sendMessage(`[${this.trialCount + 1}번째 테스트] 등급을 입력하세요.`);

    this.awaitingInput = true;  // 사용자의 입력을 기다림
  }

  // 사용자가 디스코드 채널에 메시지를 보냈을 때
  handleUserInput(message) {
    if (!this.awaitingInput) return;  // 입력 대기 중이 아니면 무시
  
    let itemName = message.content.trim();
  
    // 따옴표와 공백을 제거하여 유연한 입력 처리
    itemName = itemName.replace(/['"]/g, '').trim();
  
    // 사용자 입력을 목록의 일부와 매칭시켜 처리
    const matchedItem = Object.keys(this.itemProbabilities).find(item => item === itemName);
    console.log("사용자가 선택한 등급: " + itemName);
    if (!matchedItem) {
      this.sendMessage("❌ 유효하지 않은 등급입니다. 다시 입력하세요.");
      return this.promptUser();
    }
  
    const { probability} = this.itemProbabilities[matchedItem];
    const isSuccess = Math.random() < probability;
  
    if (isSuccess) {
      this.sendMessage(`✅ [성공] ${matchedItem}`);
      this.successCount++;

      // 승급 로직 추가
      if (matchedItem === '레어★★★') {
        this.sendUpgradeMessage('엘리트 ★★★★', '#9b59b6');  // 보라색
      } else if (matchedItem === '엘리트 ★★★★') {
        this.sendUpgradeMessage('에픽★★★★★', '#e91e63');  // 진한 핑크색
      } else if (matchedItem === '에픽★★★★★') {
        this.sendUpgradeMessage('전설', '#f39c12');  // 진한 노란색
      }

    } else {
      this.sendMessage(`❌ [실패] ${matchedItem}`);
      this.failureCount++;
    }
  
    this.trialCount++;
    this.awaitingInput = false;  // 입력 완료 후 다시 대기 상태로 전환
    this.promptUser();  // 다음 입력을 받기 위해 다시 호출
  }

  // 승급 메세지 보내기
  async sendUpgradeMessage(upgradeLevel, color) {
    const embed = new EmbedBuilder()
      .setColor(color)
      .setDescription(`🎉 ${upgradeLevel}로 승급! 지금입니다!`)
      .setTimestamp();

    await this.sendMessage({ embeds: [embed] });
  }

  // 테스트 종료
  async endTest() {
    await this.sendMessage("📊 테스트 종료!\n" +
      `총 시도 횟수: ${this.trialCount}\n` +
      `성공 횟수: ${this.successCount} (${((this.successCount / this.trialCount) * 100).toFixed(2)}%)\n` +
      `실패 횟수: ${((this.failureCount / this.trialCount) * 100).toFixed(2)}%`);
  }
}
