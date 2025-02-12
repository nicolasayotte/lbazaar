# Laravel Development Environment using Docker and Sail

```bash
git clone https://github.com/lebazaarweb2/groundfloor.git
cd ~/src/groundfloor
git checkout web3
cp .env.example .env
```

## Set the following env variables in the .env file.

```ini
FEED_WEBHOOK_AUTH_TOKEN="get-from-blockfrost"
EXCHANGE_WEBHOOK_AUTH_TOKEN="get-from-blockfrost"
BLOCKFROST_API_KEY="get-from-blockfrost"
OWNER_WALLET_ADDR=""
OWNER_PKH=""
ROOT_KEY=""
OPTIMIZE=true
NETWORK=preprod
MIN_ADA=2000000
MAX_TX_FEE=500000
MIN_CHANGE_AMT=1000000
```

Note: If you require a root key and corresponding owner pkh, please see
additional notes below on how to create it.

Update with correct .env variable values

## Install PHP

```bash
sudo apt-add-repository ppa:ondrej/php
sudo apt update
sudo apt install -y php8.2 php8.2-cli php8.2-common php8.2-xml
curl -sS https://getcomposer.org/installer -o composer-setup.php
sudo php composer-setup.php --install-dir=/usr/local/bin --filename=composer

composer -V
#Composer version 2.5.7 2023-05-24 15:00:39

php -v
#PHP 8.2.7 (cli) (built: Jun  8 2023 15:27:12) (NTS)
#Copyright (c) The PHP Group
#Zend Engine v4.2.7, Copyright (c) Zend Technologies
#with Zend OPcache v8.2.7, Copyright (c), by Zend Technologies
```

## Setup PHP environment

```bash
composer install --ignore-platform-reqs
```

## Install Docker

```bash
sudo apt-get update
sudo apt-get install ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo   "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" |   sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo docker run hello-world
```

### Docker Desktop (optional)

Go to https://docs.docker.com/desktop/install/ubuntu/ and download DEB package

```bash
sudo dpkg -i ~/Downloads/docker-desktop-4.20.1-amd64.deb
```

If you have missing qemu-system-x86 dependency, do the following steps:

```bash
sudo apt install qemu-system-x86
sudo apt --fix-broken install
sudo dpkg -i ~/Downloads/docker-desktop-4.20.1-amd64.deb
```

Now start the docker desktop and keep it running in the background

## Install DB & App

> ! Note that if your Docker needs `sudo` so will `sail`

```bash
sudo ./vendor/bin/sail up
```

The console will show Docker initialization outputs:

```
groundfloor-mysql-1  |
groundfloor-mysql-1  | [Entrypoint] Starting MySQL 8.0.32-1.2.11-server
groundfloor-mysql-1  | 2023-06-09T11:57:32.069298Z 0 [Warning] [MY-011068] [Server] The syntax '--skip-host-cache' is deprecated and will be removed in a future release. Please use SET GLOBAL host_cache_size=0 instead.
groundfloor-mysql-1  | 2023-06-09T11:57:32.072076Z 0 [System] [MY-010116] [Server] /usr/sbin/mysqld (mysqld 8.0.32) starting as process 1
groundfloor-mysql-1  | 2023-06-09T11:57:32.107414Z 1 [System] [MY-013576] [InnoDB] InnoDB initialization has started.
groundfloor-mysql-1  | 2023-06-09T11:57:32.911162Z 1 [System] [MY-013577] [InnoDB] InnoDB initialization has ended.
groundfloor-mysql-1  | 2023-06-09T11:57:33.785559Z 0 [Warning] [MY-010068] [Server] CA certificate ca.pem is self signed.
groundfloor-mysql-1  | 2023-06-09T11:57:33.785896Z 0 [System] [MY-013602] [Server] Channel mysql_main configured to support TLS. Encrypted connections are now supported for this channel.
groundfloor-mysql-1  | 2023-06-09T11:57:33.845849Z 0 [System] [MY-011323] [Server] X Plugin ready for connections. Bind-address: '::' port: 33060, socket: /var/run/mysqld/mysqlx.sock
groundfloor-mysql-1  | 2023-06-09T11:57:33.847133Z 0 [System] [MY-010931] [Server] /usr/sbin/mysqld: ready for connections. Version: '8.0.32'  socket: '/var/lib/mysql/mysql.sock'  port: 3306  MySQL Community Server - GPL.
```

From host

```bash
sudo ./vendor/bin/sail root-shell
```

Execute these commands

```bash
cd  ..
chown -R sail *
chgrp -R sail *
exit
```

From host

```bash
sudo ./vendor/bin/sail bash
```

Execute these commands

```bash
npm install
npm run dev
```

From host 

## Run DB Migration

```bash
sudo ./vendor/bin/sail artisan migrate --seed
```

Expected console output (example)

```
   INFO  Preparing database.

  Creating migration table ................................................................. 213ms DONE

   INFO  Running migrations.

  2014_10_10_000000_create_countries_table ................................................. 194ms DONE
[...]
  2023_07_05_181919_create_nft_transactions ................................................ 262ms DONE

   INFO  Seeding database.

  Database\Seeders\CountrySeeder .............................................................. RUNNING
  Database\Seeders\CountrySeeder ........................................................ 83.94 ms DONE

[...]

  Database\Seeders\CourseFeedbackSeeder ....................................................... RUNNING
  Database\Seeders\CourseFeedbackSeeder .................................................. 1.24 ms DONE
```

### Set Environment Variables.

When you make a change, you will need to run auto-load to have them read and available.

```bash
sudo ./vendor/bin/sail composer dump-autoload
```

## Installing web3 npm modules

```bash
cd ./web3
npm install
```

## Creating Root Key & Owner PKH

```bash
cd ./web3/init
export ENTROPY="use a 24 word seed phrase"
node ./generate-private-key.mjs
```

This will output the following which can be used for the env variables above.

```ini
ROOT_KEY=e875684...a254e6cb6754b3866a0ba
OWNER_PKH=3a0c3...1bd2d766aa
```

_For `sail` command convenience, add this to your `~/.zshrc` or `~/.bashrc`_

```bash
alias sail='[ -f sail ] && sh sail || sh vendor/bin/sail'
```

## Website Access

Access local URL: http://localhost:8080
Admin:

-   http://localhost:8080/admin/login
-   email: `admin@lebazaar.com`
-   password: `test1234`

### Accesing Database:

```
(host) $ sail mysql
```

### To explore more Sail commands:

```
(host) $ sail --help
```

or check official [docs](https://laravel.com/docs/9.x/sail)

### Dev Env

You may need to remove the following line from vite.config.js for your local
dev env since this is only used for production.

```
server: {
    host: 'www.e-learning.com',
  }
```

## Getting to the logs

```bash
#in the server
cd /var/www/groundfloor
sudo su
sudo docker container ls
sudo docker exec -it $container_id /bin/bash
```

```bash
#in the container
su application
tail -n40 storage/logs/web3.log
```

# Deployment

## Staging Deployment


```bash

#   SSH into the server (Ask Admin for pem file)
ssh -i test-lebazaar-key.pem ubuntu@18.178.42.141

# go to project docker-build directory:
cd /var/www/groundfloor/docker-build

# run as root
sudo su

# allow docker not load cache
export DOCKER_BUILDKIT=0

# first, create a Github token [here](https://github.com/settings/tokens). (One time only)
#    -   Tokens(Classic)
#    -   Make sure expiration is long enough or no expiration at all
# get the latest branch
git checkout staging; git pull

# execute build script. It will as for Github username and token (generated from step 1)
.staging.sh

# Install npm packages?
docker container ls
container_id="<id>"
docker exec -it $container_id /bin/bash

cd ./web3
npm install

#  Check https://stage.l-e-bazaar.com/ to make sure changes have been published
```


## Production Deployment

```bash
#   First, create a Github token [here](https://github.com/settings/tokens). (One time only)
#   - Tokens(Classic)
#   - Make sure expiration is long enough or no expiration at all

#   SSH into the server (Ask Admin for pem file)
ssh -i prod-lebazaar.pem ubuntu@54.249.86.195

#   Go to project docker-build directory:
cd /var/www/groundfloor/docker-build

#   run as root
sudo su

#   allow docker not load cache
export DOCKER_BUILDKIT=0

#   Execute build script. It will as for Github username and token (generated from step 1)
./production.sh -v patch
./production.sh -v minor
./production.sh -v major

#   Check https://l-e-bazaar.com/ to make sure changes have been published
```

# Payment Methods

## NMKR

### Setup Gateway
https://studio.preprod.nmkr.io/projects

### Setup Info
https://docs.nmkr.io/nmkr-studio/set-up-sales/nmkr-pay/set-up-nmkr-pay

### Button
https://docs.nmkr.io/nmkr-studio/set-up-sales/nmkr-pay/website-integration

This is the test button for Testnet test NFT

https://pay.preprod.nmkr.io/?p=0da0ef090d5e46d9b9588fc45524e808&n=a80b1df9ef934e1e889ab110e3e363b6
https://studio.nmkr.io/images/buttons/paybutton_1_1.svg
