<?php
/**
 * POST - Cria conta e já devolve o token (login automático).
 * Corpo: { nome, email, senha }
 */
declare(strict_types=1);
require __DIR__ . '/comum.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    responder(405, ['erro' => 'Use POST.']);
}

$dados   = corpo();
$nome    = trim((string) ($dados['nome'] ?? ''));
$email   = strtolower(trim((string) ($dados['email'] ?? '')));
$senha   = (string) ($dados['senha'] ?? '');

if ($nome === '') {
    responder(422, ['erro' => 'Informe seu nome.']);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    responder(422, ['erro' => 'E-mail inválido.']);
}
if (strlen($senha) < 6) {
    responder(422, ['erro' => 'A senha precisa de pelo menos 6 caracteres.']);
}

$existe = db()->prepare('SELECT id FROM usuarios WHERE email = ?');
$existe->execute([$email]);
if ($existe->fetch()) {
    responder(409, ['erro' => 'Este e-mail já está cadastrado.']);
}

$token = bin2hex(random_bytes(32));
$stmt = db()->prepare(
    'INSERT INTO usuarios (nome, email, senha_hash, token) VALUES (?, ?, ?, ?)'
);
$stmt->execute([$nome, $email, password_hash($senha, PASSWORD_DEFAULT), $token]);

responder(201, [
    'token'     => $token,
    'usuario'   => ['id' => (int) db()->lastInsertId(), 'nome' => $nome, 'email' => $email],
    'mensagem'  => 'Conta criada com sucesso!',
]);
