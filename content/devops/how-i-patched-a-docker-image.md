---
title: "🔧 How I Patched a Docker Image Without Breaking Its Original Behavior"
description: "Learn how to patch a Docker image while preserving its original ENTRYPOINT and CMD, verify the changes, and automate the process with a shell script."
slug: "how-i-patched-a-docker-image"
date: "2026-10-24"
author: "Mukul Joshi"
category: "Docker"
tags:
  - Docker
  - Containers
  - DevOps
  - Shell Scripting
  - Automation
cover: "/blog/assets/docker-patch-thumbnail.png"
draft: false
published: true
---

# 🔧 How I Patched a Docker Image Without Breaking Its Original Behavior

> "When you want to tweak a Docker image but treat its structure like a sacred temple."

![Docker patch blog thumbnail](/blog/assets/docker-patch-thumbnail.png)

---

## 🧩 The Problem

I had to make a **minor update** to an existing Docker image — just a small edit to the `/etc/hosts` file. Easy, right?

But here's the catch:

- I **couldn't modify the original image structure**.
- The image had a **critical `ENTRYPOINT` and `CMD`**, and I didn't want to break them.
- I **couldn't run the container normally**, because its `ENTRYPOINT` would kick in immediately.
- I needed to **make the change, verify it, and commit it** — without disrupting the intended execution of the image.

Classic case of "sneak in, do the job, leave no trace."

---

## 🛠️ My Goal

- **Modify:** `/etc/hosts` — Add a custom host entry.
- **Preserve:** The original `ENTRYPOINT` and `CMD`.
- **Commit:** Save it all into a **new image**.
- **Verify:** Make sure everything works exactly like the original.

---

## 🧭 The Step-by-Step Journey

### 🔍 Step 1: Find the Original ENTRYPOINT and CMD

```bash
docker inspect nginx:latest \
  --format='ENTRYPOINT={{json .Config.Entrypoint}} CMD={{json .Config.Cmd}}'
```

Let's say the output was:

```text
ENTRYPOINT=["/docker-entrypoint.sh"]
CMD=["nginx","-g","daemon off;"]
```

### 🧱 Step 2: Create a Container Without Triggering ENTRYPOINT

```bash
docker create --name temp-container --entrypoint /bin/sh nginx:latest
```

**OR**

```bash
docker run -itd --name temp-container --entrypoint=sh nginx:latest
```

### 🔧 Step 3: Start the Container and Patch `/etc/hosts`

```bash
docker start temp-container
docker exec -it temp-container /bin/sh
```

Inside the container:

```bash
echo "192.168.1.100 mycustomhost" >> /etc/hosts
exit
```

### 📦 Step 4: Commit It — With ENTRYPOINT and CMD Restored

```bash
docker commit \
  --change 'ENTRYPOINT ["/docker-entrypoint.sh"]' \
  --change 'CMD ["nginx","-g","daemon off;"]' \
  temp-container nginx:latest-new
```

### 🧹 Step 5: Cleanup

```bash
docker rm -f temp-container
```

---

## ✅ Verification: Trust, But Verify

### 🔸 Check ENTRYPOINT and CMD

```bash
docker inspect nginx:latest-new \
  --format='ENTRYPOINT={{json .Config.Entrypoint}} CMD={{json .Config.Cmd}}'
```

### 🔸 Check `/etc/hosts`

```bash
docker run --rm nginx:latest-new cat /etc/hosts
```

### 🔸 Full Behavior Test

```bash
docker run --rm nginx:latest-new
```

---

## 🎯 Why This Approach Rocks

- 🔒 **Safe:** No changes to core image logic.
- 🔁 **Repeatable:** The process can be automated.
- 🧼 **Clean:** The final image is as lean and consistent as the original.

---

## 🧰 Bonus: Automate It with a Script?

Here's a teaser for a future post: I've built a shell script that automates this entire process — from inspecting to committing — for any image.

### 🐚 `docker-image-patcher.sh`

```bash
#!/bin/bash

# Usage: ./docker-image-patcher.sh <image-name> <new-image-tag> <host-entry>
# Example: ./docker-image-patcher.sh nginx:latest nginx:patched "192.168.1.100 mycustomhost"

set -e

IMAGE_NAME="$1"
NEW_IMAGE_TAG="$2"
HOST_ENTRY="$3"

if [[ -z "$IMAGE_NAME" || -z "$NEW_IMAGE_TAG" || -z "$HOST_ENTRY" ]]; then
  echo "Usage: $0 <image-name> <new-image-tag> <host-entry>"
  exit 1
fi

TEMP_CONTAINER="temp-container-$$"

echo "🔍 Inspecting original image: $IMAGE_NAME"

ORIGINAL_ENTRYPOINT=$(docker inspect "$IMAGE_NAME" --format='{{json .Config.Entrypoint}}')
ORIGINAL_CMD=$(docker inspect "$IMAGE_NAME" --format='{{json .Config.Cmd}}')

echo "📋 Original ENTRYPOINT: $ORIGINAL_ENTRYPOINT"
echo "📋 Original CMD: $ORIGINAL_CMD"

echo "🚧 Creating temp container: $TEMP_CONTAINER"
docker create --name "$TEMP_CONTAINER" --entrypoint /bin/sh "$IMAGE_NAME" > /dev/null

echo "🚀 Starting and patching /etc/hosts"
docker start "$TEMP_CONTAINER" > /dev/null
docker exec "$TEMP_CONTAINER" sh -c "echo '$HOST_ENTRY' >> /etc/hosts"

echo "📦 Committing new image: $NEW_IMAGE_TAG"
docker commit \
  --change "ENTRYPOINT $ORIGINAL_ENTRYPOINT" \
  --change "CMD $ORIGINAL_CMD" \
  "$TEMP_CONTAINER" "$NEW_IMAGE_TAG" > /dev/null

echo "🧹 Cleaning up temp container"
docker rm -f "$TEMP_CONTAINER" > /dev/null

echo "✅ Image $NEW_IMAGE_TAG created with patched /etc/hosts"
```

---

## 📝 Extra Note: The Better Way to Add a Custom Hostname

While experimenting with Docker image modifications, there's an important detail to remember: **changes made to `/etc/hosts` inside a container generally don't persist through `docker commit`** because Docker manages this file at runtime.

If your goal is simply to map a custom hostname to an IP address, you don't need to modify or rebuild the original image.

Docker provides the `--add-host` option for this purpose.

### Example

```bash
docker run --add-host=mycustomhost:192.168.1.100 nginx:latest
```

This adds the following entry to the container's `/etc/hosts` file:

```text
192.168.1.100 mycustomhost
```

### Why Use This Approach?

- **No image modification:** The original Docker image remains unchanged.
- **Persistent configuration:** Docker creates the hostname mapping when the container starts.
- **Easy to maintain:** Update the mapping when launching a new container.
- **Works with existing images:** No need to rebuild or commit a modified image.

If you're using Docker Compose, you can configure the same mapping:

```yaml
services:
  nginx:
    image: nginx:latest
    extra_hosts:
      - "mycustomhost:192.168.1.100"
```

**Key takeaway:** If you only need a custom hostname mapping, prefer `--add-host` or Docker Compose's `extra_hosts`. Reserve image modifications for changes that genuinely belong in the image itself.

---

## 🏁 Final Thoughts

Sometimes, the best kind of Docker change is the one that's **invisible** to the rest of your system.

This technique lets you make surgical tweaks **without blowing up the image's original purpose** — a powerful skill when you're working with shared base images in large CI/CD pipelines.