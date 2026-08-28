<?php

declare(strict_types=1);

const CONTACT_EMAIL = 'contato@pastoral360.com.br';
const CONTACT_COPY_EMAIL = 'feliperj629@gmail.com';
const MAX_FIELD_LENGTH = 160;
const MAX_MESSAGE_LENGTH = 4000;

header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Cache-Control: no-store, max-age=0');

function respond(int $status, string $message): never
{
    http_response_code($status);

    if (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && $_SERVER['HTTP_X_REQUESTED_WITH'] === 'XMLHttpRequest') {
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode(['message' => $message], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    header('Content-Type: text/html; charset=UTF-8');
    $safeMessage = htmlspecialchars($message, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    echo '<!doctype html><html lang="pt-BR"><meta charset="UTF-8">';
    echo '<meta name="viewport" content="width=device-width,initial-scale=1">';
    echo '<title>Contato — Pastoral 360</title>';
    echo '<body><main><h1>Pastoral 360</h1><p>' . $safeMessage . '</p>';
    echo '<p><a href="./#contato">Voltar ao formulário</a></p></main></body></html>';
    exit;
}

function post_value(string $name, int $maxLength = MAX_FIELD_LENGTH): string
{
    $value = $_POST[$name] ?? '';
    if (!is_string($value)) {
        return '';
    }

    $value = trim(preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? '');
    return mb_substr($value, 0, $maxLength, 'UTF-8');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405, 'Método não permitido. Use o formulário de contato.');
}

$contentLength = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($contentLength > 20_000) {
    respond(413, 'Os dados enviados ultrapassam o limite permitido.');
}

// Campo invisível: preenchimento indica automação simples de spam.
if (post_value('website') !== '') {
    respond(200, 'Mensagem recebida.');
}

$name = post_value('nome');
$church = post_value('igreja');
$city = post_value('cidade_uf');
$phone = post_value('telefone');
$email = post_value('email');
$message = post_value('mensagem', MAX_MESSAGE_LENGTH);
$consent = post_value('consentimento');

if ($name === '' || $church === '' || $city === '' || $phone === '' || $message === '' || $consent !== 'sim') {
    respond(422, 'Preencha os campos obrigatórios e autorize o contato.');
}

if (mb_strlen($name) < 2 || mb_strlen($message) < 10) {
    respond(422, 'Informe um nome válido e uma mensagem com pelo menos 10 caracteres.');
}

$phoneDigits = preg_replace('/\D+/', '', $phone) ?? '';
if (strlen($phoneDigits) < 10 || strlen($phoneDigits) > 13) {
    respond(422, 'Informe um telefone com DDD válido.');
}

if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(422, 'Informe um endereço de e-mail válido ou deixe o campo vazio.');
}

$replyTo = $email !== '' ? $email : CONTACT_EMAIL;
$subjectText = 'Novo contato pelo site — Pastoral 360';
$subject = '=?UTF-8?B?' . base64_encode($subjectText) . '?=';
$body = implode("\r\n", [
    'Novo pedido de contato recebido pelo site.',
    '',
    'Nome: ' . $name,
    'Igreja: ' . $church,
    'Cidade/UF: ' . $city,
    'Telefone/WhatsApp: ' . $phone,
    'E-mail: ' . ($email !== '' ? $email : 'Não informado'),
    '',
    'Mensagem:',
    $message,
]);
$headers = implode("\r\n", [
    'From: Pastoral 360 <' . CONTACT_EMAIL . '>',
    'Sender: ' . CONTACT_EMAIL,
    'Reply-To: ' . $replyTo,
    'Return-Path: ' . CONTACT_EMAIL,
    'Cc: ' . CONTACT_COPY_EMAIL,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'X-Mailer: PHP/' . PHP_VERSION,
]);

$sent = mail(CONTACT_EMAIL, $subject, $body, $headers, '-f' . CONTACT_EMAIL);

if (!$sent) {
    $lastError = error_get_last();
    $errorDetail = is_array($lastError) && isset($lastError['message'])
        ? ' Detalhe do PHP: ' . $lastError['message']
        : '';
    error_log('[pastoral360] Falha ao enviar formulário de contato.' . $errorDetail);
    respond(503, 'Não foi possível enviar sua mensagem agora. Tente novamente em alguns instantes.');
}

respond(200, 'Mensagem enviada. Em breve entraremos em contato.');
