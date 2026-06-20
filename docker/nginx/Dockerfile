FROM nginxinc/nginx-unprivileged:1.27-alpine

ARG NGINX_BENCH_MODE=0

USER 0
RUN apk add --no-cache openssl curl \
  && mkdir -p /etc/nginx/ssl \
  && chown -R nginx:nginx /etc/nginx/ssl

COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d/ /etc/nginx/conf.d/
COPY snippets/ /etc/nginx/snippets/
RUN rm -f /etc/nginx/conf.d/default.conf

RUN if [ "$NGINX_BENCH_MODE" = "1" ]; then \
  sed -i 's/rate=40r\/s/rate=400r\/s/' /etc/nginx/conf.d/fstec.conf && \
  sed -i 's/rate=200r\/s/rate=2000r\/s/' /etc/nginx/conf.d/fstec.conf && \
  sed -i 's/rate=20r\/s/rate=200r\/s/' /etc/nginx/conf.d/fstec.conf && \
  sed -i 's/burst=80/burst=800/' /etc/nginx/conf.d/fstec.conf && \
  sed -i 's/burst=400/burst=4000/' /etc/nginx/conf.d/fstec.conf && \
  sed -i 's/burst=40/burst=400/' /etc/nginx/conf.d/fstec.conf; \
  fi

USER nginx

EXPOSE 8080 8443

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -fsS http://127.0.0.1:8080/healthz > /dev/null || exit 1
