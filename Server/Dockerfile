FROM php:8.3-fpm AS base

RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip

# Keep MySQL for prod, SQLite for tests/CI
RUN docker-php-ext-install pdo_mysql pdo_sqlite mbstring exif pcntl bcmath gd

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

COPY . /var/www

FROM base AS ci
RUN composer install --no-interaction --optimize-autoloader

FROM base AS prod
RUN composer install --no-interaction --optimize-autoloader --no-dev --ignore-platform-reqs

RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache

EXPOSE 9000
CMD ["php-fpm"]