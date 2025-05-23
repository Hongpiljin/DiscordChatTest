import pkg from 'discord.js';
const { EmbedBuilder } = pkg;

export default class ProbabilityTestGame {
  constructor(client) {
    this.client = client;
   this.itemProbabilities = {
  "고급": { probability: 0.9 },             // 성공 90%
  "고급★": { probability: 0.85 },           // 성공 85%
  "레어★★": { probability: 0.8 },           // 성공 80%
  "레어★★★": { probability: 0.5 },          // 성공 50%
  "엘리트 ★★★★": { probability: 0.4 },     // 성공 40%
  "에픽★★★★★": { probability: 0.1 },       // 성공 10%
};
    this.maxTrials = 10;
    this.resetState();
  }

  resetState() {
    this.trialCount = 0;
    this.successCount = 0;
    this.failureCount = 0;
    this.awaitingInput = false;
    this.stats = {};
    this.targetChannel = null;
  }

  async start(channelId) {
    this.resetState();

    this.targetChannel = await this.client.channels.fetch(channelId);
    if (!this.targetChannel) {
      console.error("❌ 채널을 찾을 수 없습니다.");
      return;
    }

    const gradeListEmbed = new EmbedBuilder()
      .setColor('#2ecc71')
      .setTitle("🎲 확률 테스트: 등급 목록")
      .setDescription(
        Object.entries(this.itemProbabilities)
          .map(([item, { probability }]) =>
            `**${item}** — ${Math.floor(probability * 100)}%`
          )
          .join('\n')
      );

    await this.sendMessage({ embeds: [gradeListEmbed] });
    await this.promptUser();
  }

  async sendMessage(content) {
    if (this.targetChannel) {
      await this.targetChannel.send(content);
    } else {
      console.log("[콘솔 출력]", content);
    }
  }

  async promptUser() {
    if (this.trialCount >= this.maxTrials) {
      return this.endTest();
    }

    await this.sendMessage(`🎯 [${this.trialCount + 1}번째 테스트] 등급을 입력하세요. (종료하려면 '종료' 입력)`);
    this.awaitingInput = true;
  }

  async handleUserInput(message) {
    if (!this.awaitingInput) return;

    let itemName = message.content.trim().replace(/['"]/g, '');

    if (itemName === "종료") {
      this.awaitingInput = false;
      await this.sendMessage("⏹️ 테스트가 종료되었습니다.");
      return this.endTest();
    }

    const matchedItem = Object.keys(this.itemProbabilities).find(item => item === itemName);

    if (!matchedItem) {
      await this.sendMessage("❌ 유효하지 않은 등급입니다. 다시 입력하세요.");
      return this.promptUser();
    }

    const { probability } = this.itemProbabilities[matchedItem];
    const isSuccess = Math.random() < probability;

    if (!this.stats[matchedItem]) {
      this.stats[matchedItem] = { success: 0, fail: 0 };
    }

    if (isSuccess) {
      await this.sendMessage(`✅ [성공] ${matchedItem}`);
      this.successCount++;
      this.stats[matchedItem].success++;

      // 승급 로직
      if (matchedItem === '레어★★★') {
        await this.sendUpgradeMessage('엘리트 ★★★★', '#9b59b6');
      } else if (matchedItem === '엘리트 ★★★★') {
        await this.sendUpgradeMessage('에픽★★★★★', '#e91e63');
      } else if (matchedItem === '에픽★★★★★') {
        await this.sendUpgradeMessage('전설★★★★★★', '#f39c12');
      }

    } else {
      await this.sendMessage(`❌ [실패] ${matchedItem}`);
      this.failureCount++;
      this.stats[matchedItem].fail++;
    }

    this.trialCount++;
    this.awaitingInput = false;

    if (this.trialCount >= this.maxTrials) {
      return this.endTest();
    }

    this.promptUser();
  }

  async sendUpgradeMessage(upgradeLevel, color) {
    const embed = new EmbedBuilder()
      .setColor(color)
      .setDescription(`🎉 **${upgradeLevel}로 승급! 지금입니다!**`)
      .setTimestamp();

    await this.sendMessage({ embeds: [embed] });
  }

  async endTest() {
    if (this.trialCount === 0) {
      await this.sendMessage("테스트가 진행되지 않았습니다.");
      return;
    }

    let summary = `📊 **테스트 결과 요약**\n`;
    summary += `총 시도 횟수: ${this.trialCount}\n\n`;

    for (const item in this.stats) {
      const { success, fail } = this.stats[item];
      const total = success + fail;
      const rate = total === 0 ? 0 : ((success / total) * 100).toFixed(2);

      summary += `▶ **${item}**: ${total}회 (성공 ${success}, 실패 ${fail}) - 성공률 ${rate}%\n`;
    }

    await this.sendMessage(summary);
  }
}
