# $ docker build --file Dockerfile --tag peter-polar-bear .

# Global variables
ARG DEFAULT_LOG_DIR_PATH=/app/logs


# Install step copies the manifests (allows layer caching unless a pacakge.json changes)
FROM oven/bun:1.4.0 AS install

WORKDIR /repo

COPY bun.lock package.json /repo/

RUN bun install --frozen-lockfile --ignore-scripts


# Build step copies actual content and compiles it
FROM install AS build

# git is used by compile.ts to inject the git hash
RUN apt-get update \
    && apt-get install -y --no-install-recommends git \
    && rm -rf /var/lib/apt/lists/*

# The .git directory must be present in the build context for it to succeed.
COPY .git .git

COPY ./ ./

WORKDIR /repo
RUN NODE_ENV=production bun run compile


# Runtime step handles the actual running of the executable
FROM alpine:3.21 AS runtime
ARG DEFAULT_LOG_DIR_PATH

# ca-certificates for outbound TLS; libgcc/libstdc++ are needed by the musl-built binary
RUN apk add --no-cache ca-certificates libgcc libstdc++

# Add the non-admin user "bot"
RUN addgroup -S bot \
    && adduser -S -D -h /app -s /sbin/nologin -G bot bot

# Copy the executable
WORKDIR /app
COPY --from=build --chown=bot:bot /repo/build/peter-polar-bear-* ./
COPY --from=build --chown=bot:bot /repo/migrations ./migrations
RUN ln -s ./peter-polar-bear-* ./peter-polar-bear \
    && chown -h bot:bot ./peter-polar-bear

USER bot

ENV LOG_DIR_PATH=${DEFAULT_LOG_DIR_PATH}

RUN mkdir ${DEFAULT_LOG_DIR_PATH}
VOLUME ${DEFAULT_LOG_DIR_PATH}

ENTRYPOINT ["./peter-polar-bear"]
