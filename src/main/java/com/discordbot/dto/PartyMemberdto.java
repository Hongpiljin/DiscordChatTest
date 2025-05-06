package com.discordbot.dto;

public class PartyMemberdto {
    private String nickname;
    private String job;
    private int power;

    // The constructor name should match the class name, so it should be PartyMemberdto, not PartyMember
    public PartyMemberdto(String nickname, String job, int power) {
        this.nickname = nickname;
        this.job = job;
        this.power = power;
    }

    public String getNickname() {
        return nickname;
    }

    public String getJob() {
        return job;
    }

    public int getPower() {
        return power;
    }
}
