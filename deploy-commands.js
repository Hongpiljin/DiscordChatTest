const { REST, Routes } = require('discord.js');
const { token, clientId, guildId } = require('./config.json');

const commands = [
  {
    name: 'hello',
    description: '👋 봇이 인사합니다.',
  },
  {
    name: 'ping',
    description: '🏓 Pong!',
  },
];

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('📡 슬래시 명령어를 등록 중입니다 (길드)...');

    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands },
    );

    console.log('✅ 슬래시 명령어가 성공적으로 등록되었습니다!');
  } catch (error) {
    console.error('❌ 등록 중 오류 발생:', error);
  }
})();
