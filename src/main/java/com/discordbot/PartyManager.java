package com.discordbot;


import com.discordbot.dto.Partydto;
import com.discordbot.dto.PartyMemberdto;

import java.util.ArrayList;
import java.util.List;

public class PartyManager {
    // 파티 목록을 저장할 리스트
    private static List<Partydto> partyList = new ArrayList<>();

    // 파티 추가
    public static void createParty(String name, String difficulty, String creator) {
        Partydto party = new Partydto(name, difficulty, creator);
        partyList.add(party);
    }

    // 파티에 멤버 추가
    public static void addMemberToParty(String partyName, String nickname, String job, int power) {
        for (Partydto party : partyList) {
            if (party.getName().equalsIgnoreCase(partyName)) {
                PartyMemberdto member = new PartyMemberdto(nickname, job, power);
                party.addMember(member);
                return;
            }
        }
        System.out.println("파티를 찾을 수 없습니다.");
    }

    // 파티 목록 조회
    public static List<Partydto> getAllParties() {
        return partyList;
    }

    // 특정 파티 조회
    public static Partydto getPartyByName(String name) {
        for (Partydto party : partyList) {
            if (party.getName().equalsIgnoreCase(name)) {
                return party;
            }
        }
        return null;
    }

    //파티 삭제 메서드
    public static void removeParty(String partyName) {
        Partydto partyToRemove = getPartyByName(partyName);
        if (partyToRemove != null) {
            partyList.remove(partyToRemove);
        }
    }

    public static boolean removeMemberFromParty(String partyName, String nickname) {
        Partydto party = getPartyByName(partyName);
        if (party != null) {
            PartyMemberdto member = party.getMemberByNickname(nickname);
            if (member != null) {
                return party.getMembers().remove(member);
            }
        }
        return false;
    }
}

