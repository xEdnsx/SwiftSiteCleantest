# Stage 1: Official PHP with Apache
FROM php:8.2-apache

# Set working directory
WORKDIR /var/www/html

# Install required system packages, CA certificates and PHP build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    unzip \
    libzip-dev \
    ca-certificates \
    && update-ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install required PHP extensions for Laravel 12 & MySQL/TiDB
RUN docker-php-ext-install -j$(nproc) \
    pdo_mysql \
    bcmath \
    zip \
    opcache

# Enable Apache rewrite module
RUN a2enmod rewrite

# Install Composer from official Composer image
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Copy application files
COPY . /var/www/html

# Copy Apache virtual host configuration
COPY docker/000-default.conf /etc/apache2/sites-available/000-default.conf

# Copy entrypoint script and set executable permissions
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Install production PHP dependencies without dev dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist

# Set proper ownership and permissions for Laravel writable directories
RUN mkdir -p storage/framework/sessions \
             storage/framework/views \
             storage/framework/cache \
             storage/framework/cache/data \
             storage/app/public \
             storage/app/private \
             storage/logs \
             bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Expose default HTTP port (Render overrides PORT at runtime)
EXPOSE 8080

# Run entrypoint script
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
