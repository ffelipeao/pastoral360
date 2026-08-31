<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurePublicResponses
{
    /**
     * Apply the canonical origin and baseline browser protections.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $canonicalHost = config('app.canonical_host');
        $forceHttps = config('app.force_https');
        $expectedScheme = $forceHttps ? 'https' : $request->getScheme();
        $expectedHost = $canonicalHost ?: $request->getHttpHost();

        if (($forceHttps && ! $request->isSecure())
            || ($canonicalHost && ! hash_equals(strtolower($canonicalHost), strtolower($request->getHttpHost())))) {
            return new RedirectResponse(
                $expectedScheme.'://'.$expectedHost.$request->getRequestUri(),
                Response::HTTP_MOVED_PERMANENTLY,
            );
        }

        $response = $next($request);

        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
        $response->headers->set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');

        if ($request->isSecure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        return $response;
    }
}
