import WordChainGame from './wordChainGame.js';
import NunchiGame from './nunchiGame.js';
import ProbabilityTestGame from './probabilityTestBot.js';  // 문제 없이 import
import Cooking from './Cooking.js';
import dotenv, { config } from 'dotenv';
import { Client, GatewayIntentBits, SlashCommandBuilder } from 'discord.js';
dotenv.config();  // dotenv를 불러와서 환경 변수 로딩
console.log(config);

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const wordChainGame = new WordChainGame(client); // client 전달
const nunchiGame = new NunchiGame(client); // client 전달
const probabilityTestGame = new ProbabilityTestGame(client); // 변수명 맞추기
const cooking = new Cooking(client);
client.on('messageCreate', (message) => {
  if (message.content.startsWith('!게임')) {
    const roomName = '게임방1';
    const playerTag = message.member?.displayName || message.author.username;

    const result = wordChainGame.joinRoom(roomName, playerTag);
    message.channel.send(result);
  }
  
  if (message.content.startsWith('!확률')) {
    // !확률 [채널ID] 로 입력한다고 가정
    const parts = message.content.split(' ');
    const channelId = parts[1] || message.channel.id; // 디폴트는 현재 채널
    probabilityTestGame.start(channelId);  // 수정된 부분
  }
});

const parties = new Map(); // 서버별 파티 저장

// 봇이 준비되었을 때 실행될 코드
client.once('ready', async () => {
  console.log('봇이 준비되었습니다!');
  client.user.setActivity('봇 준비 완료');

  try {
    const guild = await client.guilds.fetch(process.env.GUILD_ID);
    if (!guild) {
      console.error('지정한 길드를 찾을 수 없습니다.');
      return;
    }
  // 슬래시 명령어 등록
  const commands = [
new SlashCommandBuilder()
  .setName('파티생성')
  .setDescription('파티를 생성합니다.')
  .addStringOption(option => option.setName('파티이름').setDescription('파티의 이름').setRequired(true))
  .addStringOption(option => option.setName('난이도').setDescription('파티의 난이도').setRequired(true)
    .addChoices(
      { name: '입문', value: '입문' },
      { name: '어려움', value: '어려움' },
      { name: '매우어려움', value: '매우어려움' },
      { name: '지옥1', value: '지옥1' },
      { name: '지옥2', value: '지옥2' }
    ))
  .addStringOption(option => option.setName('직업').setDescription('방장 직업').setRequired(true))
  .addIntegerOption(option => option.setName('전투력').setDescription('방장 전투력').setRequired(true))
  .addStringOption(option => option.setName('닉네임').setDescription('파티장 닉네임').setRequired(true)),  // 여기 추가
    new SlashCommandBuilder().setName('파티참여').setDescription('파티에 참여합니다.')
      .addStringOption(option => option.setName('파티이름').setDescription('참여할 파티의 이름').setRequired(true))
      .addStringOption(option => option.setName('닉네임').setDescription('사용자의 닉네임').setRequired(true))
      .addStringOption(option => option.setName('직업').setDescription('사용자의 직업').setRequired(true))
      .addIntegerOption(option => option.setName('전투력').setDescription('사용자의 전투력').setRequired(true)),
    new SlashCommandBuilder().setName('파티목록').setDescription('현재 존재하는 파티 목록을 표시합니다.'),
    new SlashCommandBuilder().setName('파티정보').setDescription('파티의 정보를 확인합니다.')
      .addStringOption(option => option.setName('파티이름').setDescription('정보를 조회할 파티의 이름').setRequired(true)),
    new SlashCommandBuilder().setName('파티해산').setDescription('파티를 해산합니다.')
      .addStringOption(option => option.setName('파티이름').setDescription('해산할 파티의 이름').setRequired(true)),
   new SlashCommandBuilder()
  .setName('파티탈퇴')
  .setDescription('파티에서 탈퇴합니다.')
  .addStringOption(option => option.setName('파티이름').setDescription('탈퇴할 파티의 이름').setRequired(true)),
   new SlashCommandBuilder().setName('끝말잇기방생성').setDescription('끝말잇기 방을 생성합니다.')
    .addStringOption(option => option.setName('방이름').setDescription('방의 이름').setRequired(true))
    .addIntegerOption(option => option.setName('최대인원').setDescription('최대 인원수를 설정합니다.').setRequired(true)),
  new SlashCommandBuilder().setName('끝말잇기참여').setDescription('끝말잇기 방에 참여합니다.')
    .addStringOption(option => option.setName('방이름').setDescription('참여할 방의 이름').setRequired(true)),
  new SlashCommandBuilder().setName('끝말잇기단어입력').setDescription('끝말잇기 단어를 입력합니다.')
    .addStringOption(option => option.setName('방이름').setDescription('단어를 입력할 방 이름').setRequired(true))
    .addStringOption(option => option.setName('단어').setDescription('입력할 단어').setRequired(true)),
  new SlashCommandBuilder().setName('눈치게임방생성').setDescription('눈치게임 방을 생성합니다.')
    .addStringOption(option => option.setName('방이름').setDescription('생성할 방 이름').setRequired(true))
    .addIntegerOption(option => option.setName('최대인원').setDescription('최대 인원 수').setRequired(true)),
  new SlashCommandBuilder().setName('눈치게임참여').setDescription('눈치게임 방에 참여합니다.')
    .addStringOption(option => option.setName('방이름').setDescription('참여할 방 이름').setRequired(true)),
  new SlashCommandBuilder().setName('눈치게임입력').setDescription('숫자를 입력합니다.')
    .addStringOption(option => option.setName('방이름').setDescription('방 이름').setRequired(true))
    .addIntegerOption(option => option.setName('숫자').setDescription('입력할 숫자').setRequired(true)),
  new SlashCommandBuilder()
    .setName('확률테스트')
    .setDescription('아이템 등급 확률 테스트를 시작합니다.'),
  new SlashCommandBuilder()
  .setName('요리목록')
  .setDescription('만들 수 있는 요리 목록을 보여줍니다.'),
  
new SlashCommandBuilder()
  .setName('요리계산')
  .setDescription('요리 재료를 계산합니다.')
  .addStringOption(option => 
    option
      .setName('요리명')
      .setDescription('요리 이름')
      .setRequired(true)
      .addChoices(
        { name: '흰살생선 뫼니에르', value: '흰살생선 뫼니에르' },
        { name: '부야베스', value: '부야베스' },
        { name: '고등어와 연어 스테이크', value: '고등어와 연어 스테이크' },
        { name: '메기 피시 앤 칩스', value: '메기 피시 앤 칩스' }
      )
  )
  .addIntegerOption(option =>
    option
      .setName('개수')
      .setDescription('만들 개수')
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(100)
  )
  .addStringOption(option =>
  option
    .setName('내재료')
    .setDescription('내가 가지고 있는 재료를 입력하세요. 예: 브리흐네 잉어 🐟=10,감자 🥔=20')
    .setRequired(true)
  // .setAutocomplete(true) // 이 줄 삭제
),
  ];

  // 명령어 등록 (서버에)
 await guild.commands.set(commands);
    console.log('슬래시 명령어가 등록되었습니다!');
  } catch (error) {
    console.error('명령어 등록 중 오류:', error);
  }
});



// 확률 테스트 
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const commandName = interaction.commandName;

  if (commandName === '확률테스트') {
    try {
      await interaction.reply({ content: '🎲 확률 테스트를 시작합니다!', flags: 64 }); // ephemeral 대신 flags 사용
      probabilityTestGame.start(interaction.channelId); // 현재 채널 ID 전달
    } catch (error) {
      console.error('Error handling interaction: ', error);
    }
  }
});

// 파티 기능 
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const commandName = interaction.commandName;

if (commandName === '파티생성') {
  const partyName = interaction.options.getString('파티이름');
  const difficulty = interaction.options.getString('난이도');
  const leaderJob = interaction.options.getString('직업');
  const leaderPower = interaction.options.getInteger('전투력');
  const leaderNickname = interaction.options.getString('닉네임');  // 닉네임 받아오기

  let guildParties = parties.get(interaction.guild.id);
  if (!guildParties) {
    guildParties = new Map();
    parties.set(interaction.guild.id, guildParties);
  }

  if (guildParties.has(partyName)) {
    await interaction.reply('⚠️ 이미 존재하는 파티입니다.');
    return;
  }

  guildParties.set(partyName, {
    creator: interaction.user.id,
    members: [{
      id: interaction.user.id,
      nickname: leaderNickname,  // 디스코드 닉네임 대신 여기에 저장
      job: leaderJob,
      power: leaderPower,
      isLeader: true,
    }],
    difficulty,
  });

  await interaction.reply(`🎉 **${partyName}** 파티가 생성되었습니다! (방장: ${leaderNickname}, 난이도: ${difficulty})`);
}
  // 파티참여 
  else if (commandName === '파티참여') {
    const partyName = interaction.options.getString('파티이름');
    const nickname = interaction.options.getString('닉네임');
    const job = interaction.options.getString('직업');
    const power = interaction.options.getInteger('전투력');
  
    if (!parties.has(interaction.guild.id)) {
      await interaction.reply('❌ 파티 목록이 없습니다.');
      return;
    }
  
    const guildParties = parties.get(interaction.guild.id);
    if (!guildParties.has(partyName)) {
      await interaction.reply('❌ 존재하지 않는 파티입니다.');
      return;
    }
  
    if (!nickname || !job || power === null) {
      let missingFields = [];
      if (!nickname) missingFields.push('닉네임');
      if (!job) missingFields.push('직업');
      if (power === null) missingFields.push('전투력');
      await interaction.reply(`⚠️ ${missingFields.join(', ')}(을)를 입력해야 합니다.`);
      return;
    }
  
    const party = guildParties.get(partyName);
if (party.members.some(member => member.id === interaction.user.id)) {
  await interaction.reply(`⚠️${nickname}님은 이미 이 파티에 참여하고 있습니다.`);
  return;
}
  
    party.members.push({
  id: interaction.user.id,
  nickname,
  job,
  power,
  isLeader: false,
});
    await interaction.reply(`✅ ${nickname}님이 **"${partyName}"** 파티에 참여했습니다! (직업: ${job}, 전투력: ${power})`);
  }
  //파티목록
  else if (commandName === '파티목록') {
    if (!parties.has(interaction.guild.id)) {
      await interaction.reply('📭 파티 목록이 없습니다.');
      return;
    }
  
    const guildParties = parties.get(interaction.guild.id);
    if (guildParties.size === 0) {
      await interaction.reply('📭 현재 생성된 파티가 없습니다.');
      return;
    }
  
    let response = '📋 **현재 존재하는 파티 목록:**\n';
    guildParties.forEach((party, name) => {
      response += `\n🎯 **파티 이름**: ${name} | 난이도: ${party.difficulty}\n`;
    party.members.forEach(member => {
  const leaderTag = member.isLeader ? '👑파티장 ' : '👤 ';
  response += `${leaderTag}${member.nickname} (직업: ${member.job}, 전투력: ${member.power})\n`;
});
    });
  
    await interaction.reply(response);
  }
  //파티정보
  else if (commandName === '파티정보') {
    const partyName = interaction.options.getString('파티이름');
  
    if (!parties.has(interaction.guild.id)) {
      await interaction.reply('❌ 파티 목록이 없습니다.');
      return;
    }
  
    const guildParties = parties.get(interaction.guild.id);
    if (!guildParties.has(partyName)) {
      await interaction.reply('❌ 존재하지 않는 파티입니다.');
      return;
    }
  
    const party = guildParties.get(partyName);
    let response = `📘 **파티 이름**: ${partyName}\n`;
    response += `🧩 난이도: ${party.difficulty}\n`;
    response += '👥 멤버 목록:\n';
party.members.forEach(member => {
  const leaderTag = member.isLeader ? '👑파티장 ' : '👤 ';
  response += `${leaderTag}${member.nickname} (직업: ${member.job}, 전투력: ${member.power})\n`;
});
  
    await interaction.reply(response);
  }
  //파티해산
   if (interaction.commandName === '파티해산') {
    const partyName = interaction.options.getString('파티이름');

    const guildParties = parties.get(interaction.guild.id);
    if (!guildParties || !guildParties.has(partyName)) {
      await interaction.reply({ content: '❌ 존재하지 않는 파티입니다.', ephemeral: true });
      return;
    }

    const party = guildParties.get(partyName);
const userIsLeader = party.members.some(
  member => member.id === interaction.user.id && member.isLeader
);

if (!userIsLeader) {
  await interaction.reply({ content: '❌ 파티장만 파티를 해산할 수 있습니다.', ephemeral: true });
  return;
}

    guildParties.delete(partyName);
    await interaction.reply(`🗑️ 파티 **${partyName}** 가 성공적으로 해산되었습니다.`);
  }
  //파티탈퇴
 else if (commandName === '파티탈퇴') {
  const partyName = interaction.options.getString('파티이름');

  if (!parties.has(interaction.guild.id)) {
    await interaction.reply('❌ 파티 목록이 없습니다.');
    return;
  }

  const guildParties = parties.get(interaction.guild.id);
  if (!guildParties.has(partyName)) {
    await interaction.reply('❌ 존재하지 않는 파티입니다.');
    return;
  }

  const party = guildParties.get(partyName);
  const memberIndex = party.members.findIndex(member => member.id === interaction.user.id);

  if (memberIndex === -1) {
    await interaction.reply('⚠️ 파티에 참여하고 있지 않습니다.');
    return;
  }

  const member = party.members[memberIndex];
  party.members.splice(memberIndex, 1);

  await interaction.reply(`🚪${member.nickname}님이 ${partyName} 파티에서 탈퇴했습니다.`);
}

  //끝말잇기 생성
  if (commandName === '끝말잇기방생성') {
    const roomName = interaction.options.getString('방이름');
    const maxPlayers = interaction.options.getInteger('최대인원');
    const channelId = interaction.channel.id; // 현재 명령어가 실행된 채널의 ID

    const result = wordChainGame.createRoom(roomName, maxPlayers, channelId); 
    await interaction.reply(result);
  //끝말잇기참여
  } else if (commandName === '끝말잇기참여') {
    const roomName = interaction.options.getString('방이름');
    const player = interaction.user.username; // 사용자 닉네임으로 수정

    const result = wordChainGame.joinRoom(roomName, player); // 방에 참가
    await interaction.reply(result);
  //끝말잇기단어입력
  } else if (commandName === '끝말잇기단어입력') {
      const roomName = interaction.options.getString('방이름');
      const word = interaction.options.getString('단어');
      const player = interaction.user.username; // 사용자 닉네임으로 수정
  
      // 단어 입력 결과 처리
      const result = await wordChainGame.inputWord(roomName, player, word); 
  
  
      // 단어 입력 결과 메시지 전송
      await interaction.reply(result); 
  


  } else if (commandName === '눈치게임방생성') {
    const roomName = interaction.options.getString('방이름');
    const maxPlayers = interaction.options.getInteger('최대인원');
    const result = nunchiGame.createRoom(roomName, maxPlayers);
    await interaction.reply(result);

  } else if (commandName === '눈치게임참여') {
    const roomName = interaction.options.getString('방이름');
    const player = interaction.user.username; // 플레이어 이름 확인, 필요시 수정
    const result = nunchiGame.joinRoom(roomName, player, interaction.channel.id);
    await interaction.reply(result);

} else if (commandName === '눈치게임입력') {
    const roomName = interaction.options.getString('방이름');
    const number = interaction.options.getInteger('숫자');
    const player = interaction.user.username; // 플레이어 이름 확인, 필요시 수정
    const result = nunchiGame.inputNumber(roomName, player, number);
    await interaction.reply(result);
  }
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return; // 봇의 메시지는 무시

  // 확률 테스트 게임 진행 중일 때만 입력 받기
  if (probabilityTestGame.awaitingInput && message.channel.id === probabilityTestGame.targetChannel.id) {
    probabilityTestGame.handleUserInput(message);
  }
});


// 환경변수에서 봇 토큰을 로드하여 로그인
client.login(process.env.DISCORD_TOKEN);
