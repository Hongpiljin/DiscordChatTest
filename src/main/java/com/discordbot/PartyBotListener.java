package com.discordbot;

import com.discordbot.dto.Partydto;
import com.discordbot.dto.PartyMemberdto;

import net.dv8tion.jda.api.events.message.MessageReceivedEvent;
import net.dv8tion.jda.api.hooks.ListenerAdapter;

import java.util.List;

public class PartyBotListener extends ListenerAdapter {

    @Override
    public void onMessageReceived(MessageReceivedEvent event) {
        String message = event.getMessage().getContentRaw();

        if (message.startsWith("/파티생성")) {
            // 예: /파티생성 가라앉은유적 입문
            String[] parts = message.split(" ");
            if (parts.length == 3) {
                String partyName = parts[1];
                String difficulty = parts[2];
                
                if (!isValidDifficulty(difficulty)) {
                    event.getChannel().sendMessage("유효한 난이도를 입력해주세요 (입문, 어려움, 매우어려움)").queue();
                    return;
                }
        
                // 🔥 수정된 부분: creator를 추가로 받음
                String creator = event.getAuthor().getName(); // 디스코드 유저 닉네임
        
                PartyManager.createParty(partyName, difficulty, creator);
                event.getChannel().sendMessage("파티 \"" + partyName + "\"가 " + difficulty + " 난이도로 생성되었습니다! (방장: " + creator + ")").queue();
            } else {
                event.getChannel().sendMessage("올바른 형식으로 파티 이름과 난이도를 입력해주세요. 예: /파티생성 파티이름 난이도").queue();
            }
        }

        if (message.startsWith("/파티참여")) {
            // 예: /파티참여 가라앉은유적 user123 전사 1500
            String[] parts = message.split(" ");
            if (parts.length == 5) {
                String partyName = parts[1];
                String nickname = parts[2];
                String job = parts[3];
                int power;
                
                try {
                    power = Integer.parseInt(parts[4]);
                } catch (NumberFormatException e) {
                    event.getChannel().sendMessage("전투력은 숫자 형식이어야 합니다.").queue();
                    return;
                }

                // 파티가 존재하는지 확인
                Partydto party = PartyManager.getPartyByName(partyName);
                if (party == null) {
                    event.getChannel().sendMessage("해당 파티가 존재하지 않습니다. 파티 이름을 다시 확인해주세요.").queue();
                    return;
                }

                // 파티에 멤버 추가
                PartyManager.addMemberToParty(partyName, nickname, job, power);
                event.getChannel().sendMessage(nickname + "님이 파티 \"" + partyName + "\"에 참여했습니다!").queue();
            } else {
                event.getChannel().sendMessage("참여할 파티 이름과 멤버 정보를 입력해주세요. 예: /파티참여 파티이름 닉네임 직업 전투력").queue();
            }
        }

        if (message.startsWith("/파티목록")) {
            // 모든 파티 목록을 보여줌
            List<Partydto> parties = PartyManager.getAllParties();
            if (parties.isEmpty()) {
                event.getChannel().sendMessage("현재 생성된 파티가 없습니다.").queue();
                return;
            }

            StringBuilder sb = new StringBuilder("현재 존재하는 파티 목록:\n");
            for (Partydto party : parties) {
                sb.append("파티 이름: ").append(party.getName()).append(", 난이도: ").append(party.getDifficulty()).append("\n");
                for (PartyMemberdto member : party.getMembers()) {
                    sb.append("  - ").append(member.getNickname()).append(" (").append(member.getJob()).append("), 전투력: ").append(member.getPower()).append("\n");
                }
            }
            event.getChannel().sendMessage(sb.toString()).queue();
        }

        if (message.startsWith("/파티정보")) {
            // 예: /파티정보 가라앉은유적
            String[] parts = message.split(" ");
            if (parts.length == 2) {
                String partyName = parts[1];
                Partydto party = PartyManager.getPartyByName(partyName);
                if (party != null) {
                    StringBuilder sb = new StringBuilder("파티 이름: ").append(party.getName()).append("\n");
                    sb.append("난이도: ").append(party.getDifficulty()).append("\n");
                    sb.append("멤버 목록:\n");
                    for (PartyMemberdto member : party.getMembers()) {
                        sb.append("  - ").append(member.getNickname()).append(" (").append(member.getJob()).append("), 전투력: ").append(member.getPower()).append("\n");
                    }
                    event.getChannel().sendMessage(sb.toString()).queue();
                } else {
                    event.getChannel().sendMessage("해당 파티를 찾을 수 없습니다.").queue();
                }
            } else {
                event.getChannel().sendMessage("파티 정보를 조회할 파티 이름을 입력해주세요. 예: /파티정보 파티이름").queue();
            }
        }

        if (message.startsWith("/파티해체")) {
            // 예: /파티해체 가라앉은유적
            String[] parts = message.split(" ");
            if (parts.length == 2) {
                String partyName = parts[1];
                Partydto party = PartyManager.getPartyByName(partyName);

                if (party == null) {
                    event.getChannel().sendMessage("해당 파티를 찾을 수 없습니다.").queue();
                    return;
                }

                // 파티 생성자와 요청자가 일치하는지 확인
                if (party.getCreator().equals(event.getAuthor().getName())) {
                    PartyManager.removeParty(partyName);
                    event.getChannel().sendMessage("파티 \"" + partyName + "\"가 해체되었습니다.").queue();
                } else {
                    event.getChannel().sendMessage("파티를 생성한 사람만 파티를 해체할 수 있습니다.").queue();
                }
            } else {
                event.getChannel().sendMessage("파티 이름을 입력해주세요. 예: /파티해체 파티이름").queue();
            }
        }

        if (message.startsWith("/파티탈퇴")) {
            // 예: /파티탈퇴 가라앉은유적 user123
            String[] parts = message.split(" ");
            if (parts.length == 3) {
                String partyName = parts[1];
                String nickname = parts[2];
        
                // 파티가 존재하는지 확인
                Partydto party = PartyManager.getPartyByName(partyName);
                if (party == null) {
                    event.getChannel().sendMessage("해당 파티가 존재하지 않습니다. 파티 이름을 다시 확인해주세요.").queue();
                    return;
                }
        
                // 파티에 해당 멤버가 있는지 확인
                PartyMemberdto member = party.getMemberByNickname(nickname);
                if (member == null) {
                    event.getChannel().sendMessage(nickname + "님은 해당 파티에 없습니다.").queue();
                    return;
                }
        
                // 멤버를 파티에서 제거
                PartyManager.removeMemberFromParty(partyName, nickname);
                event.getChannel().sendMessage(nickname + "님이 파티 \"" + partyName + "\"에서 탈퇴했습니다.").queue();
            } else {
                event.getChannel().sendMessage("파티 이름과 탈퇴할 닉네임을 입력해주세요. 예: /파티탈퇴 파티이름 닉네임").queue();
            }
        }
    }

    // 난이도 유효성 검사
    private boolean isValidDifficulty(String difficulty) {
        return difficulty.equals("입문") || difficulty.equals("어려움") || difficulty.equals("매우어려움");
    }
}
