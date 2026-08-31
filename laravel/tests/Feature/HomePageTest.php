<?php

namespace Tests\Feature;

use Tests\TestCase;

class HomePageTest extends TestCase
{
    public function test_root_route_renders_the_canonical_static_template_as_blade(): void
    {
        $response = $this->get('/');

        $expected = str_replace(
            [
                'href="index.html"',
                'href="assets/images/pastoral360-favicon.svg"',
                'href="assets/images/icone.png"',
                'href="assets/css/styles.css"',
                'src="assets/images/icone.png"',
                'src="assets/images/Logo1.png"',
                'src="assets/js/main.js"',
            ],
            [
                'href="'.url('/').'"',
                'href="'.asset('assets/images/pastoral360-favicon.svg').'"',
                'href="'.asset('assets/images/icone.png').'"',
                'href="'.asset('assets/css/styles.css').'"',
                'src="'.asset('assets/images/icone.png').'"',
                'src="'.asset('assets/images/Logo1.png').'"',
                'src="'.asset('assets/js/main.js').'"',
            ],
            file_get_contents(base_path('../index.html')),
        );

        $response->assertOk();
        $this->assertSame($expected, $response->getContent());
        $this->assertStringNotContainsString('{{', $response->getContent());
        $this->assertStringNotContainsString('@extends', $response->getContent());
    }

    public function test_home_page_preserves_sections_anchors_and_calls_to_action(): void
    {
        $response = $this->get('/');

        $response
            ->assertOk()
            ->assertSeeInOrder([
                'Sua igreja organizada por completo, em um só lugar.',
                'Menos retrabalho. Mais clareza para cuidar da igreja.',
                'Uma visão organizada de cada área da igreja',
                'Sede e filiais conectadas em uma visão integrada',
                'Benefícios que acompanham cada responsabilidade',
                'Da demonstração à rotina organizada',
                'Escolha o plano ideal para o momento da sua igreja',
                'Informações para conhecer a Pastoral 360',
                'Veja como organizar sua igreja em um só lugar',
            ]);

        foreach (['inicio', 'recursos', 'para-sua-igreja', 'filiais', 'planos', 'contato'] as $anchor) {
            $response->assertSee('id="'.$anchor.'"', false);
            $response->assertSee('href="#'.$anchor.'"', false);
        }

        $response
            ->assertSee('Solicitar demonstração')
            ->assertSee('Conhecer os recursos')
            ->assertSee('Começar período grátis')
            ->assertSee('Falar pelo WhatsApp');
    }

    public function test_home_page_preserves_metadata_analytics_and_structured_data(): void
    {
        $response = $this->get('/');

        $response
            ->assertOk()
            ->assertSee('<title>Pastoral 360 | Gestão integrada para igrejas</title>', false)
            ->assertSee('name="description"', false)
            ->assertSee('name="robots" content="index, follow"', false)
            ->assertSee('property="og:title" content="Pastoral 360 | Gestão integrada para igrejas"', false)
            ->assertSee('name="twitter:card" content="summary"', false)
            ->assertSee('type="application/ld+json"', false)
            ->assertSee('"@type": "SoftwareApplication"', false)
            ->assertSee('https://www.googletagmanager.com/gtag/js?id=G-BWZTSJYEZ9', false)
            ->assertSee("gtag('config', 'G-BWZTSJYEZ9');", false);
    }

    public function test_home_page_preserves_plans_phone_and_whatsapp_protections(): void
    {
        $response = $this->get('/');

        $response->assertSeeInOrder([
            'Essencial',
            '49,90',
            'Gestão',
            '79,90',
            'Completo',
            '129,90',
            'Multi-Igrejas',
            '199,90',
        ]);

        $content = $response->getContent();

        $this->assertSame(6, substr_count($content, 'href="https://wa.me/5521964239334"'));
        $this->assertSame(6, substr_count($content, 'target="_blank" rel="noopener noreferrer"'));
        $this->assertStringContainsString('data-whatsapp-plan="Essencial" data-whatsapp-price="R$ 49,90/mês"', $content);
        $this->assertStringContainsString('data-whatsapp-plan="Multi-Igrejas" data-whatsapp-price="a partir de R$ 199,90/mês"', $content);
    }

    public function test_home_page_uses_laravel_urls_for_local_assets(): void
    {
        $response = $this->get('/');

        foreach ([
            'assets/images/pastoral360-favicon.svg',
            'assets/images/icone.png',
            'assets/images/Logo1.png',
            'assets/css/styles.css',
            'assets/js/main.js',
        ] as $path) {
            $response->assertSee(asset($path), false);
        }

        $response->assertSee('class="brand" href="'.url('/').'"', false);
    }

    public function test_home_page_does_not_require_a_database_connection(): void
    {
        config()->set('database.default', 'unavailable');
        config()->set('database.connections.unavailable', [
            'driver' => 'pgsql',
            'host' => 'invalid-database-host',
            'database' => 'unavailable',
            'username' => 'unavailable',
            'password' => 'unavailable',
        ]);

        $this->get('/')
            ->assertOk()
            ->assertSee('Pastoral 360');
    }

    public function test_public_path_is_isolated_from_the_laravel_application(): void
    {
        $this->assertSame(realpath(base_path('../www')), public_path());
        $this->assertFileExists(public_path('index.php'));
        $this->assertFileDoesNotExist(public_path('artisan'));
        $this->assertDirectoryDoesNotExist(public_path('laravel'));
    }
}
