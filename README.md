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

Note: If you require a root key and corresponding owner pkh, please see additional notes below on how to create it.

Update with correct .env variable values

## Install PHP

```bash
sudo apt-add-repository ppa:ondrej/php
sudo apt update
sudo apt install -y php8.2 php8.2-cli php8.2-common
curl -sS https://getcomposer.org/installer -o composer-setup.php
sudo php composer-setup.php --install-dir=/usr/local/bin --filename=composer
sudo apt-get install php8.2-xml

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

### Docker Desktop

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

```bash
./vendor/bin/sail up
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
./vendor/bin/sail root-shell
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
./vendor/bin/sail bash
```

Execute these commands

```bash
npm install
npm run dev
```

## Run DB Migration

```bash
./vendor/bin/sail artisan migrate --seed
```

Expected console output (example)

```
   INFO  Preparing database.

  Creating migration table ................................................................. 213ms DONE

   INFO  Running migrations.

  2014_10_10_000000_create_countries_table ................................................. 194ms DONE
  2014_10_11_000000_create_classifications_table ........................................... 192ms DONE
  2014_10_12_000000_create_users_table ................................................... 2,296ms DONE
  2014_10_12_100000_create_password_resets_table ........................................... 307ms DONE
  2019_08_19_000000_create_failed_jobs_table ............................................... 312ms DONE
  2019_12_14_000001_create_personal_access_tokens_table .................................... 450ms DONE
  2022_12_02_023826_create_user_wallets_table .............................................. 717ms DONE
  2022_12_02_024301_create_logs_table ...................................................... 764ms DONE
  2022_12_02_024432_create_notifications_table ........................................... 1,347ms DONE
  2022_12_02_024700_create_settings_table .................................................. 193ms DONE
  2022_12_02_024809_create_inquiries_table ................................................. 187ms DONE
  2022_12_02_025540_create_course_types_table .............................................. 183ms DONE
  2022_12_02_025754_create_course_categories_table ......................................... 207ms DONE
  2022_12_02_030024_create_statuses_table .................................................. 168ms DONE
  2022_12_02_030037_create_course_applications_table ..................................... 2,022ms DONE
  2022_12_02_030137_create_courses_table ................................................. 3,207ms DONE
  2022_12_06_063001_create_exams_table ..................................................... 689ms DONE
  2022_12_06_064907_create_exam_items_table ................................................ 627ms DONE
  2022_12_06_065102_create_exam_item_choices_table ......................................... 743ms DONE
  2022_12_06_065838_update_exam_items_table ................................................ 711ms DONE
  2022_12_06_070135_create_user_exams_table .............................................. 1,372ms DONE
  2022_12_06_070409_create_user_exam_answers_table ....................................... 1,989ms DONE
  2022_12_09_042731_laratrust_setup_tables ............................................... 3,746ms DONE
  2022_12_12_033244_create_course_feedback_table ......................................... 1,327ms DONE
  2022_12_12_034202_create_course_histories_table .......................................... 562ms DONE
  2023_01_19_052039_create_user_education_table ............................................ 621ms DONE
  2023_01_19_083254_create_user_certifications_table ....................................... 544ms DONE
  2023_01_19_085605_create_user_work_histories_table ....................................... 588ms DONE
  2023_01_26_010216_create_translations_table .............................................. 252ms DONE
  2023_02_07_062625_create_course_schedules ................................................ 811ms DONE
  2023_02_16_064024_create_badges .......................................................... 168ms DONE
  2023_02_16_064126_create_user_badges ..................................................... 176ms DONE
  2023_02_22_000601_create_wallet_trasaction_histories ..................................... 195ms DONE
  2023_03_01_053245_create_course_packages_table ........................................... 292ms DONE
  2023_03_01_053435_create_course_package_courses_table .................................... 383ms DONE
  2023_03_08_071700_create_votes_table ..................................................... 167ms DONE
  2023_03_08_073054_create_teacher_applications_table ...................................... 571ms DONE
  2023_03_10_022337_update_user_wallets_table .............................................. 124ms DONE
  2023_03_10_045659_update_course_schedule_table ........................................... 316ms DONE
  2023_03_10_072451_update_user_badge_table ................................................ 351ms DONE
  2023_03_13_085345_update_user_table ...................................................... 149ms DONE
  2023_03_13_103503_update_course_applications_table ....................................... 269ms DONE
  2023_03_13_104723_update_votes_table ..................................................... 256ms DONE
  2023_03_14_010812_update_teacher_applications_table ...................................... 360ms DONE
  2023_03_14_064748_update_votes_table_to_include_options .................................. 218ms DONE
  2023_03_16_054421_set_default_points_value_in_exam_items ................................. 446ms DONE
  2023_03_16_065550_add_rows_to_settings_table .............................................. 66ms DONE
  2023_03_27_082826_update_wallet_transaction_history_table ................................. 99ms DONE
  2023_03_28_065550_add_rows_to_settings_table ............................................. 116ms DONE
  2023_03_29_082826_update_user_exams_table ................................................ 133ms DONE
  2023_03_31_082826_update_wallet_transaction_table .......................................... 2ms DONE
  2023_06_19_190020_update_user_wallets .................................................... 177ms DONE
  2023_06_20_205326_add_rows_to_settings .................................................... 36ms DONE
  2023_06_21_112412_update_wallet_transaction_histories .................................... 117ms DONE
  2023_06_22_114355_update_wallet_transaction_histories ..................................... 94ms DONE
  2023_06_30_190118_create_nfts ............................................................ 138ms DONE
  2023_07_01_224935_add_nft_id_to_course_applications ...................................... 124ms DONE
  2023_07_02_193019_add_nft_id_to_courses .................................................. 139ms DONE
  2023_07_05_181919_create_nft_transactions ................................................ 262ms DONE

   INFO  Seeding database.

  Database\Seeders\CountrySeeder .............................................................. RUNNING
  Database\Seeders\CountrySeeder ........................................................ 83.94 ms DONE

  Database\Seeders\ClassificationSeeder ....................................................... RUNNING
  Database\Seeders\ClassificationSeeder ................................................. 32.82 ms DONE

  Database\Seeders\StatusSeeder ............................................................... RUNNING
  Database\Seeders\StatusSeeder ........................................................ 191.76 ms DONE

  Database\Seeders\CourseTypeSeeder ........................................................... RUNNING
  Database\Seeders\CourseTypeSeeder .................................................... 127.61 ms DONE

  Database\Seeders\CourseCategorySeeder ....................................................... RUNNING
  Database\Seeders\CourseCategorySeeder ................................................ 443.76 ms DONE

  Database\Seeders\RoleSeeder ................................................................. RUNNING
  Database\Seeders\RoleSeeder .......................................................... 113.02 ms DONE

  Database\Seeders\PermissionSeeder ........................................................... RUNNING
  Database\Seeders\PermissionSeeder ..................................................... 32.74 ms DONE

  Database\Seeders\UserSeeder ................................................................. RUNNING
  Database\Seeders\UserSeeder ........................................................ 2,253.76 ms DONE

  Database\Seeders\CourseApplicationSeeder .................................................... RUNNING
  Database\Seeders\CourseApplicationSeeder ........................................... 1,991.08 ms DONE

  Database\Seeders\CourseSeeder ............................................................... RUNNING
  Database\Seeders\CourseSeeder ........................................................ 387.00 ms DONE

  Database\Seeders\EmailSettingsSeeder ........................................................ RUNNING
  Database\Seeders\EmailSettingsSeeder .................................................. 41.49 ms DONE

  Database\Seeders\InquirySeeder .............................................................. RUNNING
  Database\Seeders\InquirySeeder ....................................................... 620.51 ms DONE

  Database\Seeders\TeacherInformationSeeder ................................................... RUNNING
  Database\Seeders\TeacherInformationSeeder ............................................ 867.25 ms DONE

  Database\Seeders\TranslationSeeder .......................................................... RUNNING
  Database\Seeders\TranslationSeeder ................................................... 406.71 ms DONE

  Database\Seeders\CourseScheduleSeeder ....................................................... RUNNING
  Database\Seeders\CourseScheduleSeeder ................................................ 328.33 ms DONE

  Database\Seeders\UserWalletSeeder ........................................................... RUNNING
  Database\Seeders\UserWalletSeeder .................................................... 494.83 ms DONE

  Database\Seeders\CourseHistorySeeder ........................................................ RUNNING
  Database\Seeders\CourseHistorySeeder .............................................. 10,240.78 ms DONE

  Database\Seeders\CourseFeedbackSeeder ....................................................... RUNNING
  Database\Seeders\CourseFeedbackSeeder .................................................. 1.24 ms DONE
```

### Set Environment Variables.

When you make a change, you will need to run auto-load to have them read and available.

```bash
./vendor/bin/sail composer dump-autoload
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

## Website Acceess

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

You may need to remove the following line from vite.config.js for your local dev env since this is only used for production.

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
docker container ls
docker exec -it $container_id /bin/bash
```

```bash
#in the container
su application
tail -n40 storage/logs/web3.log
```

## Staging Deployment

-   First, create a Github token [here](https://github.com/settings/tokens). (One time only)
    -   Tokens(Classic)
    -   Make sure expiration is long enough or no expiration at all
-   SSH into the server (Ask Admin for pem file)
    -   `ssh -i test-lebazaar-key.pem ubuntu@18.178.42.141`

```bash
# go to project docker-build directory:
cd /var/www/groundfloor/docker-build

# run as root
sudo su

# allow docker not load cache
export DOCKER_BUILDKIT=0

# execute build script. It will as for Github username and token (generated from step 1)
./staging.sh
```

-   Check https://stage.l-e-bazaar.com/ to make sure changes have been

## Production Deployment

-   First, create a Github token [here](https://github.com/settings/tokens). (One time only)
    -   Tokens(Classic)
    -   Make sure expiration is long enough or no expiration at all
-   SSH into the server (Ask Admin for pem file)
    -   `ssh -i prod-lebazaar.pem ubuntu@54.249.86.195`
-   Go to project docker-build directory:
    -   `cd /var/www/groundfloor/docker-build`
-   run as root
    -   `sudo su`
-   allow docker not load cache
    -   `export DOCKER_BUILDKIT=0`
-   Execute build script. It will as for Github username and token (generated from step 1)
    -   for patch `./production.sh -v patch`
    -   for minor changes `./production.sh -v minor`
    -   for major changes `./production.sh -v major`
-   Check https://l-e-bazaar.com/ to make sure changes have been
