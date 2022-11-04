# Laravel Development Environment using Docker and Sail
## Prerequisites

The host system needs the following to run:
* Latest Docker Desktop
* Composer v2+

## Initial Setup for Local Environment (First Run)
1. Copy example env file to .env
```
(host) $ cp .env.example .env
```

2. Install Composer dependencies
```
(host) $ composer install --ignore-platform-reqs
```

3. Start Docker containers using Sail
```
(host) $ ./vendor/bin/sail up
```

*For `sail` command convenience, add this to your `~/.zshrc` or `~/.bashrc`*
```
alias sail='[ -f sail ] && sh sail || sh vendor/bin/sail'
```

3. Install NPM packages
```
(host) $ sail npm install
```

4. Run Vite:
```
(host) $ sail npm run dev
```

5. Run migration and sample records
```
(host) $ sail artisan migrate --seed
```

5. Access local URL: http://localhost:8080

6. Start the development! :)

## Development

### Starting & Stopping Sail

To start with logs:
```
(host) $ sail up
```

To start in detached mode:
```
(host) $ sail up -d
```

To end:

### Starting & Stopping Sail
```
(host) $ sail down
```

### Executing Commands
```
(host) $ sail artisan migrate --seed
```

### Accesing Database:
```
(host) $ sail mysql
```

### To explore more Sail commands:
```
(host) $ sail --help
```
or check official [docs](https://laravel.com/docs/9.x/sail)
