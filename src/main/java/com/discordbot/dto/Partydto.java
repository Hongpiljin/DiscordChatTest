package com.discordbot.dto;

import java.util.ArrayList;
import java.util.List;

public class Partydto {
    private String name;
    private String difficulty;
    private List<PartyMemberdto> members;
    private String creator;

    // Constructor should use Partydto, not Party
    public Partydto(String name, String difficulty, String creator) {
        this.name = name;
        this.difficulty = difficulty;
        this.members = new ArrayList<>();
        this.creator = creator;
    }
    
    // Add member to party
    public void addMember(PartyMemberdto member) {
        members.add(member);
    }
    public String getCreator() {
        return creator;
    }

    public void setCreator(String creator) {
        this.creator = creator;
    }

    // Getter for members
    public List<PartyMemberdto> getMembers() {
        return members;
    }

    // Getter for party name
    public String getName() {
        return name;
    }

    // Getter for difficulty level
    public String getDifficulty() {
        return difficulty;
    }

    public PartyMemberdto getMemberByNickname(String nickname) {
        for (PartyMemberdto member : members) {
            if (member.getNickname().equals(nickname)) {
                return member;
            }
        }
        return null; // 못 찾으면 null
    }
}
