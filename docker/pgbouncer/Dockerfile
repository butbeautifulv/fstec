FROM alpine:3.20

RUN apk add --no-cache pgbouncer postgresql-client \
  && adduser -D -u 1001 -h /var/lib/pgbouncer pgbouncer \
  && mkdir -p /var/lib/pgbouncer /etc/pgbouncer/runtime \
  && chown -R pgbouncer:pgbouncer /var/lib/pgbouncer /etc/pgbouncer

COPY pgbouncer.ini pgbouncer-read.ini /etc/pgbouncer/
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER pgbouncer
EXPOSE 6432 6433

ENTRYPOINT ["/entrypoint.sh"]
