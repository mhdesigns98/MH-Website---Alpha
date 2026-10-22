---
title: "WuWa Echo Set Guide"
tagline: "A lightweight reference tool for Wuthering Waves echo farming — pick a set, see who uses it and how to build it."
description: "A single-page reference site for Wuthering Waves echo sets. Select any of the game's 25 echo sets and instantly see every character that uses it, recommended main stats per cost tier, and substat priorities — so you always know what to keep or discard while farming."
category: "Gaming Tool"
tags: ["React", "GitHub Pages", "Game Guide", "Static Site"]
status: "Live"
url: "https://mhdesigns98.github.io/wuwa-echo-guide/"
featured: true
order: 1
accent: "#f59e0b"
---

## The Problem

Wuthering Waves' echo system is deep — 25 sets, each used by multiple characters with different priority stats depending on cost tier. Community spreadsheets exist, but they're clunky to navigate mid-farming-session when you just need a quick answer: "should I keep this echo?"

## What I Built

A no-login, no-install static site where you pick an echo set and instantly see:

- The set bonus and recommended main echo to slot
- Every character that uses the set, with 4-cost, 3-cost, and 1-cost main stat recommendations
- Priority substats in order, including Energy Regen targets where relevant
- Each character's element and role (Main DPS, Sub-DPS, Support, Healer)

## How It's Built

Plain HTML with React loaded via CDN — no build step, no dependencies to install. All character and set data lives in a runtime-fetched `data.json`, so the guide can be updated by editing one file (or even directly on GitHub) without touching the app itself. A Python pipeline (`scripts/sync_prydwen_builds.py`) can pull fresh build recommendations from Prydwen.gg and merge them in, with a curated override layer for anything the scraper gets wrong.

## Why It Matters

A scratching-my-own-itch project that doubled as an exercise in building a fast, dependency-free data tool — everything is static, cacheable, and free to host on GitHub Pages.
