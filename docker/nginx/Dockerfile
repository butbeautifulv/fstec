FROM nginxinc/nginx-unprivileged:1.27-alpine

ARG NGINX_BENCH_MODE=0

USER 0
RUN apk add --no-cache openssl curl \
  && mkdir -p /etc/nginx/ssl \
  && chown -R nginx:nginx /etc/nginx/ssl

COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d/ /etc/nginx/conf.d/
COPY snippets/ /etc/nginx/snippets/

RUN if [ "$NGINX_BENCH_MODE" = "1" ]; then \
  sed -i 's/rate=20r\/s/rate=200r\/s/' /etc/nginx/nginx.conf && \
  sed -i 's/rate=10r\/s/rate=100r\/s/' /etc/nginx/nginx.conf && \
  sed -i 's/burst=40/burst=400/' /etc/nginx/conf.d/fstec.conf && \
  sed -i 's/burst=20/burst=200/' /etc/nginx/conf.d/fstec.conf; \
  fi

USER nginx

EXPOSE 8080 8443

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -fsS http://127.0.0.1:8080/healthz > /dev/null || exit 1
