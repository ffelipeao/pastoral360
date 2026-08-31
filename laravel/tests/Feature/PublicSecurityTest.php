<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use RuntimeException;
use Tests\TestCase;

class PublicSecurityTest extends TestCase
{
    public function test_unknown_routes_use_the_safe_not_found_page(): void
    {
        $this->get('/rota-inexistente')
            ->assertNotFound()
            ->assertSee('Página não encontrada')
            ->assertDontSee('NotFoundHttpException');
    }

    public function test_production_errors_do_not_expose_internal_details(): void
    {
        config()->set('app.debug', false);
        Route::get('/erro-controlado', function (): never {
            throw new RuntimeException('SEGREDO_INTERNO_NAO_PUBLICAR');
        });

        $this->get('/erro-controlado')
            ->assertInternalServerError()
            ->assertSee('Não foi possível concluir a solicitação')
            ->assertDontSee('SEGREDO_INTERNO_NAO_PUBLICAR')
            ->assertDontSee('RuntimeException')
            ->assertDontSee(base_path());
    }

    public function test_sensitive_and_traversal_paths_do_not_return_file_contents(): void
    {
        foreach ([
            '/.env',
            '/artisan',
            '/composer.json',
            '/storage/logs/laravel.log',
            '/tests/Feature/HomePageTest.php',
            '/laravel/.env',
            '/%2e%2e/laravel/.env',
        ] as $path) {
            $response = $this->get($path);

            $this->assertContains($response->getStatusCode(), [400, 403, 404]);
            $response
                ->assertDontSee('APP_KEY=')
                ->assertDontSee('SEGREDO_INTERNO_NAO_PUBLICAR');
        }
    }

    public function test_dynamic_responses_include_essential_security_headers(): void
    {
        $response = $this->get('/');

        $response
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('X-Frame-Options', 'SAMEORIGIN')
            ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
            ->assertHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()')
            ->assertHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    }

    public function test_https_responses_include_transport_security(): void
    {
        $this->get('https://localhost/')
            ->assertOk()
            ->assertHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    public function test_https_and_canonical_origin_are_enforced_only_when_configured(): void
    {
        config()->set('app.force_https', true);
        config()->set('app.canonical_host', 'www.example.com');

        $this->get('http://example.com/caminho-amigavel?origem=teste')
            ->assertRedirect('https://www.example.com/caminho-amigavel?origem=teste')
            ->assertStatus(301);
    }

    public function test_public_apache_rules_preserve_assets_and_fallback_to_front_controller(): void
    {
        $rules = file_get_contents(public_path('.htaccess'));

        $this->assertStringContainsString('Options -Indexes', $rules);
        $this->assertStringContainsString('%{REQUEST_FILENAME} -f', $rules);
        $this->assertStringContainsString('%{REQUEST_FILENAME} -d', $rules);
        $this->assertStringContainsString('RewriteRule ^ index.php [END]', $rules);
        $this->assertStringContainsString('Require all denied', $rules);
        $this->assertLessThan(
            strpos($rules, 'RewriteRule ^ index.php [END]'),
            strpos($rules, '%{REQUEST_FILENAME} -f'),
        );
    }

    public function test_front_controller_resolves_the_sibling_application_without_working_directory_assumptions(): void
    {
        $frontController = file_get_contents(public_path('index.php'));

        $this->assertStringContainsString("dirname(__DIR__).DIRECTORY_SEPARATOR.'laravel'", $frontController);
        $this->assertStringNotContainsString("__DIR__.'/../laravel", $frontController);
    }
}
