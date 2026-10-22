<?php
/**
 * Pastas e SUBPASTAS do usuário (árvore livre).
 *
 * GET                         → lista plana (o front monta a árvore)
 * POST ?acao=criar            → { nome, id_pasta_pai? }  (NULL = raiz)
 * POST ?acao=remover { id }   → apaga a pasta e as subpastas
 *                                (as plantas continuam no histórico)
 */
declare(strict_types=1);
require __DIR__ . '/comum.php';

$usuario = usuarioAtual();
$acao    = (string) ($_GET['acao'] ?? 'lista');
$metodo  = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($metodo === 'GET' && $acao === 'lista') {
    $stmt = db()->prepare(
        'SELECT pa.id, pa.nome, pa.id_pasta_pai,
                (SELECT COUNT(*) FROM pasta_plantas pp WHERE pp.id_pasta = pa.id) AS total_plantas,
                (SELECT COUNT(*) FROM pastas f WHERE f.id_pasta_pai = pa.id)       AS total_subpastas
         FROM pastas pa
         WHERE pa.id_usuario = ?
         ORDER BY pa.nome'
    );
    $stmt->execute([$usuario['id']]);
    $pastas = array_map(static function (array $p): array {
        $p['id']              = (int) $p['id'];
        $p['id_pasta_pai']    = $p['id_pasta_pai'] !== null ? (int) $p['id_pasta_pai'] : null;
        $p['total_plantas']   = (int) $p['total_plantas'];
        $p['total_subpastas'] = (int) $p['total_subpastas'];
        return $p;
    }, $stmt->fetchAll());

    responder(200, ['pastas' => $pastas]);
}

if ($metodo === 'POST' && $acao === 'criar') {
    $dados    = corpo();
    $nome     = trim((string) ($dados['nome'] ?? ''));
    $idPai    = isset($dados['id_pasta_pai']) && $dados['id_pasta_pai'] !== null
        ? (int) $dados['id_pasta_pai']
        : null;

    if ($nome === '') {
        responder(422, ['erro' => 'Dê um nome para a pasta.']);
    }
    if (mb_strlen($nome) > 100) {
        responder(422, ['erro' => 'Nome muito longo (máx. 100 caracteres).']);
    }

    if ($idPai !== null) {
        // Só pode criar subpasta dentro de pasta própria
        $dono = db()->prepare('SELECT id FROM pastas WHERE id = ? AND id_usuario = ?');
        $dono->execute([$idPai, $usuario['id']]);
        if (!$dono->fetch()) {
            responder(404, ['erro' => 'Pasta pai não encontrada.']);
        }
    }

    $stmt = db()->prepare('INSERT INTO pastas (id_usuario, nome, id_pasta_pai) VALUES (?, ?, ?)');
    $stmt->execute([$usuario['id'], $nome, $idPai]);

    responder(201, [
        'pasta' => [
            'id'              => (int) db()->lastInsertId(),
            'nome'            => $nome,
            'id_pasta_pai'    => $idPai,
            'total_plantas'   => 0,
            'total_subpastas' => 0,
        ],
        'mensagem' => 'Pasta criada!',
    ]);
}

if (($metodo === 'POST' && $acao === 'remover') || $metodo === 'DELETE') {
    $dados = $metodo === 'DELETE' ? $_GET : corpo();
    $id    = (int) ($dados['id'] ?? 0);

    $stmt = db()->prepare('SELECT id FROM pastas WHERE id = ? AND id_usuario = ?');
    $stmt->execute([$id, $usuario['id']]);
    if (!$stmt->fetch()) {
        responder(404, ['erro' => 'Pasta não encontrada.']);
    }

    // Cascata: subpastas (fk_pai) e relação com plantas (fk_pp_pasta) somem junto.
    // As plantas em si permanecem no histórico.
    db()->prepare('DELETE FROM pastas WHERE id = ?')->execute([$id]);
    responder(200, ['mensagem' => 'Pasta removida (as plantas continuam no histórico).']);
}

responder(405, ['erro' => 'Ação inválida. Use GET, POST ?acao=criar ou ?acao=remover.']);
