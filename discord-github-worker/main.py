"""
Discord-GitHub Issue Worker
디스코드와 깃허브 이슈를 연동하는 워커
"""

import json
import discord
from discord.ext import commands
from github import Github

# TODO: 구현 예정


def load_config():
    with open("config.json", "r") as f:
        return json.load(f)


def main():
    print("Discord-GitHub Issue Worker")
    print("TODO: 구현 예정")


if __name__ == "__main__":
    main()
