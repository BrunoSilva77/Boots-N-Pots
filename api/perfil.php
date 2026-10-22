<?php
/**
 * GET  - Perfil do usuário logado + resumo (plantas, pastas).
 * POST - Atualiza o nome. Corpo: { nome }
 */
declare(strict_types=1);
require __DIR__ . '/comum.php';

$usuario = usuarioAtual();
$metodo  = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($metodo === 'GET') {
    $stmt = db()->prepare(
        'SELECT
            (SELECT COUNT(*) FROM plantas_usuario WHERE id_usuario = ?) AS total_plantas,
            (SELECT COUNT(*) FROM pastas         WHERE id_usuario = ?) AS total_pastas,
            (SELECT COUNT(*) FROM plantas_usuario WHERE id_usuario = ? AND latitude IS NOT NULL)
                AS total_com_local'
    );
    $stmt->execute([$usuario['id'], $usuario['id'], $usuario['id']]);
    $resumo = $stmt->fetch();

    responder(200, [
        'usuario' => [
            'id'     => (int) $usuario['id'],
            'nome'   => $usuario['nome'],
            'email'  => $usuario['email'],
            'avatar' => $usuario['avatar'] ?? null,
        ],
        'resumo' => [
            'total_plantas'   => (int) $resumo['total_plantas'],
            'total_pastas'    => (int) $resumo['total_pastas'],
            'total_com_local' => (int) $resumo['total_com_local'],
        ],
    ]);
}

if ($metodo === 'POST') {
    $dados = corpo();
    $nome  = array_key_exists('nome', $dados) ? trim((string) $dados['nome']) : null;
    $avatar = array_key_exists('avatar', $dados)
        ? ($dados['avatar'] === null ? null : preg_replace('/[^a-z0-9-]/i', '', (string) $dados['avatar']))
        : null;

    // exige ao menos um campo para atualizar
    if (($nome === null || $nome === '') && $avatar === null && !array_key_exists('avatar', $dados)) {
        responder(422, ['erro' => 'Informe o nome ou o avatar.']);
    }

    $sets = [];
    $valores = [];
    if ($nome !== null && $nome !== '') {
        $sets[]   = 'nome = ?';
        $valores[] = $nome;
    }
    if (array_key_exists('avatar', $dados)) {
        $sets[]   = 'avatar = ?';
        $valores[] = $avatar;
    }
    $valores[] = $usuario['id'];
    db()->prepare('UPDATE usuarios SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($valores);

    $stmt = db()->prepare('SELECT nome, email, avatar FROM usuarios WHERE id = ?');
    $stmt->execute([$usuario['id']]);
    $atual = $stmt->fetch();

    responder(200, [
        'mensagem' => 'Perfil atualizado!',
        'usuario'  => [
            'id'     => (int) $usuario['id'],
            'nome'   => $atual['nome'],
            'email'  => $atual['email'],
            'avatar' => $atual['avatar'] ?? null,
        ],
    ]);
}

responder(405, ['erro' => 'Use GET ou POST.']);
