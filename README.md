[![logo](https://raw.githubusercontent.com/itamar3429/tor_proxy/master/logo.png)](https://torproject.org/)

# Tor

Tor and node forward proxy server (web proxy configured to route through tor) docker container

# What is Tor?

Tor is free software and an open network that helps you defend against traffic
analysis, a form of network surveillance that threatens personal freedom and
privacy, confidential business activities and relationships, and state security.

---

# How to use this image

**NOTE 1**: this image is setup by default to be a relay only (not an exit node)

**NOTE 2**: this image now supports relaying all traffic through the container,
see: [tor-route-all-traffic.sh](https://github.com/node/tor_proxy/blob/master/tor-route-all-traffic.sh).
For it to work, you must set `--net=host` when launching the container.

## Exposing the port

    sudo docker run -it -p 8080:8080 -p 9050:9050 -p 5000:5000 -d node/tor_proxy

**NOTE**: it will take a while for tor to bootstrap...

Then you can hit node web proxy at `http://host-ip:8080` with your browser or
tor via the socks protocol directly at `socks5://host-ip:9050`.

---

## node project

node project includes a proxy server to relay all traffic through tor proxy or through itself.

the project also includes a web api (port: 5000) that can control the tor service.

-  web api:

       expect:
       all endpoints return JSON of
       `{success:boolean;  message:string;}`



       endpoints:

       -  /start - to start the tor service

       -  /restart - to restart the tor service

       -  /reload - to reload the tor service

       -  /stop - to stop the tor service

       -  /check-ok - to make sure that tunnelling through tor is ok (not same ip as local ip)

       -  /set-country/:country_code - to set the exit node country of tor to the given country_code,
       	if fails (country not valid), will return to the default value, US.

       	set `API_PORT=<PORT>` env to set the port of the api

-  node proxy server:

       node proxy server build with node net module,
       (low level tcp socket).

       when the server receives a request and a destination request,

       the server will expect an authorization headers (in base64 - username:password) and make sure the user is allowed to the proxy.

       The authMiddleware function will get the socket and the credentials and return true if allowed.

       Otherwise will return false and send 407 http code header with proxy-authenticate: Basic; header.

       If you want to disable authentication ust change the the authMiddleware to always return true.

       Or add env variable NO_AUTH=TRUE to disable authentication.

       Implement your own user authentication (with database).

       Check authMiddleware in proxy.js for more information.

       set `PROXY_PORT=<PORT>` env to set the port of the api

## authentication:

for authentication there is a default user allowed
username:secret.admin
password:1.admin@pass

there are a few ways to implement authentication:

-  to set user set the following env vars:

   -  PROXY_ADMIN_USER=`<YOUR OWN USERNAME>`
   -  PROXY_ADMIN_PASS=`<YOUR OWN PASS>`

   this will allow only one username and password to use the proxy

-  you can also specify an external authenticator<br>
   in order to do so you need to provide the following env vars

   -  EXTERNAL_AUTH=`TRUE`
   -  USERS_AUTH_URL= the endpoint the proxy will call to verify if a user is allowed
   -  USER_AUTH_CREDENTIALS (optional) = a credentials string that will be sent along with the auth request body if specified

   if any of those is missing, the proxy will use its default authentication mechanism.

   the endpoint specified, needs to include: protocol://hostname:port/endpoint
   <br>
   it needs to support post method

   and will receive the following in the request body:

   ```json
   {
   	"username": "string",
   	"password": "string",
   	"credentials": "string"
   }
   ```

   the endpoint should return the following format:
   <br>
   success true if user allowed

   ```json
   	{
   		"success":true | false
   	}
   ```

   if endpoint doesn't exists or the request generates an error, the user will not be allowed

-  **NOTE** :

   -  proxy authentication: the proxy supports basic authentication method with the [Proxy-Authorization](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Proxy-Authorization) header

   <br>

   -  proxy controller api: the same authentication method as the proxy (as written above), <br>
      but unlike the proxy it'll expect the credentials in the following format:

      set the following header:<br>
      see: [WWW-Authenticate](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/WWW-Authenticate)
      <br>
      Authorization: Basic dXNlcm5hbWU6cGFzc3dvcmQK as (base64 of username:password)
      <br>
      if no authentication provided,
      the api will return a status of 401 Unauthorized
      with this header:<br> `WWW-Authenticate: Basic realm=please login your credentials`

---

## Complex configuration

    sudo docker run -it --rm node/tor_proxy -h
    Usage: torproxy.sh [-opt] [command]
    Options (fields in '[]' are optional, '<>' are required):
        -h          This help
        -b ""       Configure tor relaying bandwidth in KB/s
                    possible arg: "[number]" - # of KB/s to allow
        -e          Allow this to be an exit node for tor traffic
        -l "<country>" Configure tor to only use exit nodes in specified country
                    required args: "<country>" (IE, "US" or "DE")
                    <country> - country traffic should exit in
        -n          Generate new circuits now
        -p "<password>" Configure tor HashedControlPassword for control port
        -s "<port>;<host:port>" Configure tor hidden service
                    required args: "<port>;<host:port>"
                    <port> - port for .onion service to listen on
                    <host:port> - destination for service request

    The 'command' (if provided and valid) will be run instead of torproxy

ENVIRONMENT VARIABLES

-  `TORUSER` - If set use named user instead of 'tor' (for example root)
-  `BW` - As above, set a tor relay bandwidth limit in KB, IE `50`
-  `EXITNODE` - As above, allow tor traffic to access the internet from your IP
-  `LOCATION` - As above, configure the country to use for exit node selection
-  `PASSWORD` - As above, configure HashedControlPassword for control port
-  `SERVICE - As above, configure hidden service, IE '80;hostname:80'
-  `TZ` - Configure the zoneinfo timezone, IE `EST5EDT`
-  `USERID` - Set the UID for the app user
-  `GROUPID` - Set the GID for the app user
-  `USE_TOR` - If set to `FALSE`, tells node server to not use tor as a relay but connect to the target directly
-  `NO_AUTH` - If set to `TRUE`, tells the proxy server to not use authentication (allow everyone)
-  `API_PORT` - If set, api port will be the given value, otherwise will default to 5000.
-  `PROXY_PORT` - If set, proxy port will be the given value, otherwise will default to 8080.

Other environment variables beginning with `TOR_` will edit the configuration
file accordingly:

-  `TOR_NewCircuitPeriod=400` will translate to `NewCircuitPeriod 400`

## Examples

Any of the commands can be run at creation with `docker run` or later with
`docker exec -it tor torproxy.sh` (as of version 1.3 of docker).

### Setting the Timezone

    sudo docker run -it -p 8080:8080 -p 9050:9050 -p 5000:5000 -e TZ=EST5EDT \
                -d node/tor_proxy

### Start torproxy setting the allowed bandwidth:

    sudo docker run -it -p 8080:8080 -p 9050:9050 -p 5000:5000 -d node/tor_proxy -b 100

OR

    sudo docker run -it -p 8080:8080 -p 9050:9050 -p 5000:5000 -e BW=100 -d node/tor_proxy

### Start torproxy configuring it to be an exit node:

    sudo docker run -it -p 8080:8080 -p 9050:9050 -p 5000:5000 -d node/tor_proxy -e

OR

    sudo docker run -it -p 8080:8080 -p 9050:9050 -p 5000:5000 -e EXITNODE=1 \
                -d node/tor_proxy

## Test the proxy:

    curl -Lx http://127.0.0.1:8080 http://jsonip.com/

    curl -Lx http://127.0.0.1:8080 http://ifconfig.me/

### tor failures (exits or won't connect)

If you are affected by this issue (a small percentage of users are) please try
setting the TORUSER environment variable to root, IE:

    sudo docker run -it -p 8080:8080 -p 9050:9050 -p 5000:5000 -e TORUSER=root -d \
                node/tor_proxy

### Reporting

If you have any problems with or questions about this image, please contact me
through a [GitHub issue](https://github.com/node/tor_proxy/issues).
