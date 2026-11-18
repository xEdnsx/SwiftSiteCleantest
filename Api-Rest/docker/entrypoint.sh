#!/usr/bin/env sh
set -e

# Default PORT if not provided by Render
PORT="${PORT:-8080}"
echo "Configuring Apache to listen on port ${PORT}..."

# Update Apache ports configuration
sed -i "s/Listen 80/Listen ${PORT}/" /etc/apache2/ports.conf
sed -i "s/<VirtualHost \*:80>/<VirtualHost \*:${PORT}>/" /etc/apache2/sites-available/000-default.conf

# Ensure storage subdirectories and permissions exist
mkdir -p storage/framework/sessions \
         storage/framework/views \
         storage/framework/cache \
         storage/framework/cache/data \
         storage/app/public \
         storage/app/private \
         storage/logs \
         bootstrap/cache

chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

# Create storage symbolic link if not already linked
php artisan storage:link --force || true

# Safe database migration: only migrate, never fresh/wipe
if [ -n "$DB_HOST" ]; then
    echo "Running safe database migrations (php artisan migrate --force)..."
    php artisan migrate --force
    
    # Controlled seeder execution: only if explicitly requested
    if [ "$RUN_SEEDERS" = "true" ] || [ "$RUN_SEEDERS" = "1" ]; then
        echo "RUN_SEEDERS is enabled. Executing safe seeders..."
        php artisan db:seed --force
    else
        echo "RUN_SEEDERS is not set to true. Skipping automatic seeders."
    fi
else
    echo "DB_HOST is not set. Skipping migrations."
fi

# Clear and optimize config/route caching for production
if [ "$APP_ENV" = "production" ]; then
    echo "Optimizing application for production..."
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
fi

echo "Starting Apache in foreground on port ${PORT}..."
exec apache2-foreground
