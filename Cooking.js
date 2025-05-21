//Cooking.js는 슬래시커맨드 Cooking.js에서 처리함
export default class Cooking {
  constructor(client) {
    this.client = client;

    // 요리별 레시피 재료와 필요 수량
    this.recipes = {
      "흰살생선 뫼니에르": {
        "브리흐네 잉어 🐟": 5,
        "은붕어 🐠": 5,
        "감자 🥔": 5,
        "밀가루 🌾": 3,
        "레몬 🍋": 5,
        "소금 🧂": 3
      },
      "부야베스": {
        "무지개 송어 🐟": 4,
        "은어 🐠": 4,
        "토마토 🍅": 6,
        "조개 🐚": 5,
        "양파 🧅": 2,
        "마늘 🧄": 4
      },
      "고등어와 연어 스테이크": {
        "고등어 🐟": 5,
        "연어 🐠": 3,
        "마요네즈 🥫": 2,
        "아스파라거스 🥦": 4,
        "소금 🧂": 2,
        "후추 🌶️": 3
      },
      "메기 피시 앤 칩스": {
        "메기 🐟": 6,
        "감자 🥔": 6,
        "밀가루 🌾": 3,
        "완두콩 🌱": 4,
        "레몬 🍋": 2,
        "소금 🧂": 3
      }
    };

    // 모든 재료명 리스트 (중복 제거)
    this.ingredients = [...new Set(Object.values(this.recipes).flatMap(recipe => Object.keys(recipe)))];

    // 이벤트 리스너 등록
    client.on('messageCreate', message => this.handleCookingCommands(message));
    client.on('interactionCreate', async interaction => {
      if (interaction.isAutocomplete()) {
        await this.handleAutocomplete(interaction);
      } else if (interaction.isCommand()) {
        await this.handleSlashCommand(interaction);
      }
    });
  }

  // 이모지 제거 함수
  stripEmoji(str) {
    return str.replace(/[\p{Emoji_Presentation}\p{Emoji}\uFE0F]/gu, '').trim();
  }

  // 내 재료 입력 문자열 파싱 (ex: "브리흐네 잉어 🐟10,감자 🥔20" 또는 "10,20")
  parseMyIngredients(str, recipeName = null) {
    const result = {};
    if (!str) return result;

    const parts = str.split(',').map(p => p.trim());
    const allNumbers = parts.every(p => /^\d+$/.test(p));

    if (allNumbers && recipeName) {
      // 숫자만 나열된 경우, recipeName 기준으로 재료 순서에 맞춰 매칭
      const recipeIngredients = Object.keys(this.recipes[recipeName]);
      parts.forEach((numStr, idx) => {
        const qty = parseInt(numStr, 10);
        if (!isNaN(qty)) {
          const ingredient = recipeIngredients[idx];
          if (ingredient) {
            result[ingredient] = qty;
          }
        }
      });
    } else {
      // "재료명 숫자" 형식 파싱
      for (const part of parts) {
        const match = part.match(/^(.+?)\s*(\d+)$/);
        if (!match) continue;

        const rawKey = match[1].trim();
        const numVal = parseInt(match[2], 10);
        if (!rawKey || isNaN(numVal)) continue;

        const strippedKey = this.stripEmoji(rawKey).replace(/\s/g, '');
        const matchedKey = this.ingredients.find(recipeKey =>
          this.stripEmoji(recipeKey).replace(/\s/g, '') === strippedKey
        );

        if (matchedKey) {
          result[matchedKey] = numVal;
        }
      }
    }

    return result;
  }

  // 부족한 재료 목록 메시지 생성
  getRecipeResult(recipeName, count, myIngredients = null) {
    const recipe = this.recipes[recipeName];
    if (!recipe) return null;

    let resultText = `🍽️ [${recipeName}] ${count}개 분량의 부족한 재료 목록:\n`;

    const neededIngredients = {};
    for (const [ingredient, qty] of Object.entries(recipe)) {
      neededIngredients[ingredient] = qty * count;
    }

    if (myIngredients) {
      const shortageList = [];
      for (const [ingredient, neededQty] of Object.entries(neededIngredients)) {
        const haveQty = myIngredients[ingredient] || 0;
        const shortage = neededQty - haveQty;
        if (shortage > 0) {
          shortageList.push(`- ${ingredient}: ${shortage}개 부족`);
        }
      }

      if (shortageList.length === 0) {
        resultText += `✅ 충분한 재료가 있습니다! 바로 요리 가능합니다!`;
      } else {
        resultText += shortageList.join('\n');
      }
    } else {
      resultText += `❗ 내 재료를 입력하지 않으셨습니다. 부족한 재료 개수를 알려면 내 재료를 입력해주세요.`;
    }

    return resultText;
  }

  // 입력받은 요리명과 가장 유사한 레시피명 반환 (부분 일치)
  getClosestRecipeName(input) {
    const recipes = Object.keys(this.recipes);
    const loweredInput = input.toLowerCase();

    for (const name of recipes) {
      if (name.toLowerCase().includes(loweredInput)) {
        return name;
      }
    }

    return null;
  }

  // 일반 텍스트 메시지 명령 처리
handleCookingCommands(message) {
  if (message.author.bot) return;

  const content = message.content.trim();

  if (content === './요리목록') {
    const list = Object.keys(this.recipes).map(r => `- ${r}`).join('\n');
    message.reply(`🍳 만들 수 있는 요리 목록입니다:\n${list}\n\n사용법: \`./요리계산 [요리명] [개수] [내재료]\`\n내재료 예시: 브리흐네 잉어 🐟10,감자 🥔20`);
    return;
  }

  if (content.startsWith('./요리계산')) {
    // " ./요리계산 흰살생선 뫼니에르 10 5,1,2,3,4,5 " 같은 형태 처리
    const args = content.slice('./요리계산'.length).trim();

    if (!args) {
      message.reply('❗ 요리명과 개수를 모두 입력해주세요. 예: `./요리계산 부야베스 3 브리흐네 잉어 🐟10,감자 🥔20`');
      return;
    }

    // 뒤에서부터 숫자(개수)를 찾아 분리하고, 나머지는 요리명, 그리고 내재료 문자열 분리
    const lastSpaceIndex = args.lastIndexOf(' ');

    if (lastSpaceIndex === -1) {
      message.reply('❗ 개수는 반드시 입력해야 합니다. 예: `./요리계산 부야베스 3`');
      return;
    }

    const maybeCountStr = args.slice(lastSpaceIndex + 1).trim();
    const maybeCount = parseInt(maybeCountStr, 10);

    if (isNaN(maybeCount) || maybeCount <= 0) {
      message.reply('❗ 개수는 양의 정수여야 합니다.');
      return;
    }

    // 개수 바로 앞까지 문자열
    const beforeCountStr = args.slice(0, lastSpaceIndex).trim();

    // 내재료 문자열이 있는지 체크 (내재료는 보통 콤마로 구분, 공백 포함 가능)
    // 개수가 뒤에서 첫번째이므로 내재료는 없고 요리명이 beforeCountStr 전체일 수도 있음
    // 여기서는 내재료가 없으면 null 처리
    let recipeName = beforeCountStr;
    let myIngredientsStr = null;

    // 만약 요리명 뒤에 또 공백+내재료가 있으면, 내재료 분리하기 위해
    // 예) "흰살생선 뫼니에르 10 5,1,2,3,4,5" => args = "흰살생선 뫼니에르 10 5,1,2,3,4,5"
    // lastSpaceIndex는 내재료 끝이 아니라 개수 바로 뒤인 경우가 있음.
    // 그래서 개수를 뒤에서 두번째 숫자로 분리하고 그 뒤가 내재료라면 처리하는 게 더 정확.
    // 다시 분석해보면 내재료는 공백으로 분리하기 어렵고, 무조건 요리명과 개수, 내재료가 나눠져 있어야 함.
    // 개선: args.split(' ') 로 분리해서 뒤에서 개수 숫자 찾고, 그 뒤를 내재료로 인식

    const argsParts = args.split(' ');
    // 뒤에서 개수가 있는 인덱스 찾기
    let countIndex = -1;
    for (let i = argsParts.length - 1; i >= 0; i--) {
      if (/^\d+$/.test(argsParts[i])) {
        countIndex = i;
        break;
      }
    }
    if (countIndex === -1) {
      message.reply('❗ 개수가 입력되어야 합니다.');
      return;
    }

    recipeName = argsParts.slice(0, countIndex).join(' ');
    const count = parseInt(argsParts[countIndex], 10);
    myIngredientsStr = argsParts.slice(countIndex + 1).join(' ') || null;

    if (count <= 0) {
      message.reply('❗ 개수는 양의 정수여야 합니다.');
      return;
    }

    const closestName = this.getClosestRecipeName(recipeName) || recipeName;
    const myIngredients = myIngredientsStr ? this.parseMyIngredients(myIngredientsStr, closestName) : null;

    const resultMessage = this.getRecipeResult(closestName, count, myIngredients);
    if (!resultMessage) {
      message.reply('❌ 존재하지 않는 요리입니다. `./요리목록`으로 확인해주세요.');
      return;
    }

    message.reply(resultMessage);
  }
}

  // 슬래시 커맨드 처리
  async handleSlashCommand(interaction) {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;

    if (commandName === '요리목록') {
      const list = Object.keys(this.recipes).map(r => `- ${r}`).join('\n');
      await interaction.reply(`🍳 만들 수 있는 요리 목록입니다:\n${list}\n\n사용법: \`/요리계산 요리명 개수 내재료\`\n내재료 예시: 브리흐네 잉어 🐟10,감자 🥔20`);
      return;
    }

    if (commandName === '요리계산') {
      const recipeName = options.getString('요리명');
      const count = options.getInteger('개수');
      const myIngredientsStr = options.getString('내재료');

      if (!recipeName || !count || count <= 0) {
        await interaction.reply({ content: '❗ 요리명과 개수를 정확히 입력해주세요.', ephemeral: true });
        return;
      }

      await interaction.deferReply();

      const closestName = this.getClosestRecipeName(recipeName) || recipeName;
      const myIngredients = myIngredientsStr ? this.parseMyIngredients(myIngredientsStr, closestName) : null;
      const resultMessage = this.getRecipeResult(closestName, count, myIngredients);

      if (!resultMessage) {
        await interaction.editReply({ content: '❌ 존재하지 않는 요리입니다. `/요리목록`으로 확인해주세요.', ephemeral: true });
        return;
      }

      await interaction.editReply(resultMessage);
    }
  }

  // 자동완성 처리
  async handleAutocomplete(interaction) {
    if (!interaction.isAutocomplete()) return;

    const focusedValue = interaction.options.getFocused();
    const recipeName = interaction.options.getString('요리명');

    if (!recipeName || !this.recipes[recipeName]) {
      await interaction.respond([]);
      return;
    }

    const ingredients = Object.keys(this.recipes[recipeName]);
    const filtered = ingredients.filter(ingredient =>
      ingredient.toLowerCase().includes(focusedValue.toLowerCase())
    );

    await interaction.respond(
      filtered.map(choice => ({ name: choice, value: choice })).slice(0, 25)
    );
  }
}
