<?php

namespace Tests\Feature;

use Tests\TestCase;

class HomePageTest extends TestCase
{
    public function test_root_route_returns_the_temporary_home_page(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertSee('Pastoral 360')
            ->assertSee('Fundação Laravel 12');
    }

    public function test_public_path_is_isolated_from_the_laravel_application(): void
    {
        $this->assertSame(realpath(base_path('../www')), public_path());
        $this->assertFileExists(public_path('index.php'));
        $this->assertFileDoesNotExist(public_path('artisan'));
        $this->assertDirectoryDoesNotExist(public_path('laravel'));
    }
}
