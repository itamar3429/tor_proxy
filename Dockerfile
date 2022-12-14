FROM node:lts-alpine
WORKDIR /app

# service manager rc-service installaion
# RUN apk update \
# 	&& apk add --no-cache openrc \
# 	&& mkdir -p /run/openrc \
# 	&& mkdir -p /run/tor \
# 	&& touch /run/openrc/softlevel \
# 	&& rc-status -a


# Install tor and privoxy
RUN apk --no-cache --no-progress upgrade && \
    apk --no-cache --no-progress add bash curl  shadow tini tor tzdata &&\
    echo 'AutomapHostsOnResolve 1' >>/etc/tor/torrc && \
    echo 'ControlPort 9051' >>/etc/tor/torrc && \
    echo 'ControlSocket /etc/tor/run/control' >>/etc/tor/torrc && \
    echo 'ControlSocketsGroupWritable 1' >>/etc/tor/torrc && \
    echo 'CookieAuthentication 1' >>/etc/tor/torrc && \
    echo 'CookieAuthFile /etc/tor/run/control.authcookie' >>/etc/tor/torrc && \
    echo 'CookieAuthFileGroupReadable 1' >>/etc/tor/torrc && \
    echo 'DNSPort 5353' >>/etc/tor/torrc && \
    echo 'DataDirectory /var/lib/tor' >>/etc/tor/torrc && \
    echo 'ExitPolicy reject *:*' >>/etc/tor/torrc && \
    echo 'Log notice stderr' >>/etc/tor/torrc && \
    echo 'RunAsDaemon 0' >>/etc/tor/torrc && \
    echo 'SocksPort 0.0.0.0:9050 IsolateDestAddr' >>/etc/tor/torrc && \
    echo 'TransPort 0.0.0.0:9040' >>/etc/tor/torrc && \
    echo 'User tor' >>/etc/tor/torrc && \
    echo 'VirtualAddrNetworkIPv4 10.192.0.0/10' >>/etc/tor/torrc && \
    mkdir -p /etc/tor/run && \
    chown -Rh tor. /var/lib/tor /etc/tor/run && \
    chmod 0750 /etc/tor/run && \
    rm -rf /tmp/*



COPY torproxy.sh /usr/bin/

COPY nodeServer /app/

RUN cd /app \
	&& npm ci

#      tor  tor  api  proxy_server
EXPOSE 8080

HEALTHCHECK --interval=60s --timeout=15s --start-period=20s \
            CMD curl -sx socks5://localhost:9050  https://check.torproject.org/ | \
            grep -qm1 Congratulations

VOLUME ["/etc/tor", "/var/lib/tor"]

ENTRYPOINT ["/sbin/tini", "--", "/usr/bin/torproxy.sh"]