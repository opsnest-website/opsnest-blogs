---
title: "Changing the Default Branch Name in GitHub: A Step-by-Step Fix"
description: "Learn how to change a GitHub repository's default branch using GitHub CLI, authenticate your account, remove the old branch, and update your local tracking branch."
slug: "changing-github-default-branch"
date: "2026-10-24"
author: "Mukul Joshi"
category: "Git & GitHub"
tags:
  - Git
  - GitHub
  - GitHub CLI
  - Branch Management
  - DevOps
cover: "/blog/assets/github_branch_change_thumbnail.png"
draft: false
published: true
---

# Changing the Default Branch Name in GitHub: A Step-by-Step Fix

![GitHub Branch Change Thumbnail](/blog/assets/github_branch_change_thumbnail.png)

## Introduction

When I initially created a new repository, I set the default branch name as `test/dev`. At the time, it seemed fine, but later, I realized that having a more standard name like `main` or `master` would make it easier for other users to recognize and work with.

However, GitHub doesn't allow renaming the default branch directly with a simple `git branch -m` command like we do for local branches. Instead, I needed a proper sequence of commands to update the default branch name without breaking anything. Along the way, I ran into a few issues—like missing GitHub CLI (`gh`)—which I had to troubleshoot before successfully renaming my branch.

In this blog, I'll walk you through how I fixed this and share the exact commands that worked for me.

## Step 1: Installing GitHub CLI

Since I wanted to change the default branch using the GitHub CLI (`gh`), I first needed to install it.

I ran into this error:

```text
bash: gh: command not found
```

To fix this, I installed `gh` using the package manager.

**For Debian/Ubuntu-based systems:**

```bash
sudo apt update && sudo apt install gh
```

**For Red Hat-based systems:**

```bash
sudo dnf install gh
```

**For macOS using Homebrew:**

```bash
brew install gh
```

Once installed, I verified it with:

```bash
gh --version
```

## Step 2: Authenticating with GitHub

After installing `gh`, I had to log in to authenticate my GitHub access:

```bash
gh auth login
```

During authentication, I selected:

- **GitHub.com** as the account.
- **SSH** as the preferred protocol.
- Uploaded my SSH key.
- Authenticated through a web browser.

GitHub provided a one-time code, which I entered into my browser to complete authentication.

To confirm authentication, I ran:

```bash
gh auth status
```

## Step 3: Changing the Default Branch Name

Once I was authenticated, I changed the default branch name in GitHub using the following command:

```bash
gh repo edit --default-branch main
```

This sets `main` as the default branch for the repository selected by the GitHub CLI. Make sure you're operating on the intended repository.

## Step 4: Deleting the Old Branch from Remote

Since `test/dev` was no longer needed, I removed it from the remote repository:

```bash
git push origin --delete test/dev
```

**Important:** Make sure the new default branch exists on the remote and contains the required commits before deleting the old branch. Check whether any open pull requests, branch protection rules, or automation workflows still depend on `test/dev`.

## Step 5: Updating the Local Branch to Track the New Default

After changing the default branch, my local branch was still tracking `test/dev`. To fix this, I updated the upstream branch:

```bash
git branch --unset-upstream
git branch --set-upstream-to=origin/main
```

These commands assume you're currently on the local branch you want to track `origin/main` and that `origin/main` already exists locally.

If needed, fetch the latest remote branch information first:

```bash
git fetch origin
```

Verify the tracking configuration with:

```bash
git branch -vv
```

## Conclusion

Renaming the default branch in GitHub isn't as straightforward as renaming a local branch, but with the right commands, it can be done smoothly.

If you ever find yourself in a similar situation, I hope this guide helps you! 🚀