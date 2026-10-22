<?php
/**
 * POST - Login. Corpo: { email, senha }
 * Devolve um token novo (guardado no dispositivo para as próximas chamadas).
 */
declare(strict_types=1);
require __DIR__ . '/comum.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    responder(405, ['erro' => 'Use POST.']);
}

$dados = corpo();
$email = strtolower(trim((string) ($dados['email'] ?? '')));
$senha = (string) ($dados['senha'] ?? '');

if ($email === '' || $senha === '') {
    responder(422, ['erro' => 'Informe e-mail e senha.']);
}

$stmt = db()->prepare('SELECT id, nome, email, senha_hash FROM usuarios WHERE email = ?');
$stmt->execute([$email]);
$usuario = $stmt->fetch();

if (!$usuario || !password_verify($senha, $usuario['senha_hash'])) {
    responder(401, ['erro' => 'E-mail ou senha incorretos.']);
}

$token = bin2hex(random_bytes(32));
db()->prepare('UPDATE usuarios SET token = ? WHERE id = ?')->execute([$token, $usuario['id']]);

responder(200, [
    'token'   => $token,
    'usuario' => [
        'id'    => (int) $usuario['id'],
        'nome'  => $usuario['nome'],
        'email' => $usuario['email'],
    ],
]);
