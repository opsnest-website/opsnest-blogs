---
title: "A Safe Workflow for Investigating Docker Disk Usage"
description: "A repeatable, inspection-first workflow for finding Docker disk usage before removing anything."
date: "2026-10-20"
author: "OpsNest"
category: "DevOps"
tags:
  - Docker
  - Linux
  - Troubleshooting
---

Disk pressure on a Docker host can come from image layers, stopped containers, build cache, or volumes. Start by measuring the problem before cleaning anything up.

## 1. Inspect Docker's disk usage

```bash
docker system df
docker system df -v
```

The verbose view helps identify which images, containers, and volumes are consuming space. Run these commands first; they are inspection-only.

## 2. Inspect the host filesystem

```bash
df -h
du -xhd1 /var/lib/docker 2>/dev/null | sort -h
```

The `-x` option keeps `du` on the same filesystem. Confirm the Docker data-root first if your installation uses a custom path:

```bash
docker info --format '{{.DockerRootDir}}'
```

## 3. Review cleanup candidates

Do not run a broad prune command as the first response to a disk alert. Check the impact of removing unused images, stopped containers, build cache, or volumes, and confirm retention requirements with the service owner.

For example, this command only reports build-cache usage:

```bash
docker builder du
```

## 4. Record a baseline

Capture the output before and after an approved cleanup. Compare filesystem usage, Docker's own accounting, and application health. A drop in disk usage is useful only if workloads remain healthy.

## Checklist

- [ ] Confirm the filesystem and Docker data-root that are full.
- [ ] Collect `docker system df -v` output.
- [ ] Identify large directories and confirm what owns them.
- [ ] Get approval for any destructive cleanup.
- [ ] Verify workloads and disk usage after the change.

> **Operational rule:** measure first, identify ownership, then remove only resources that are safe to remove.
