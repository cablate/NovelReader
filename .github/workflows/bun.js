name: CI

on: [push, pull_request, workflow_dispatch]

jobs:
  build:
    name: Run Type Check, Linters & Tests
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Set up Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun i

      - name: Check types
        run: bun run type-check

      - name: Check linting
        run: bun run lint

      - name: Run tests
        run: bun run build

      - name: Run tests
        run: bun run start

      - name: Check commits messages
        uses: wagoid/commitlint-github-action@v5
