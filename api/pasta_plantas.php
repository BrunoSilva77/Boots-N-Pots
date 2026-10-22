<?php
/**
 * Relação planta ↔ pasta.
 *
 * GET  ?acao=listar&id_pasta=N        → plantas dentro da pasta
 * POST ?acao=adicionar { id_pasta, id_planta }
 * POST ?acao=remover   { id_pasta, id_planta }
 */
declare(strict_types=1);
require __DIR__ . '/comum.php';

$usuario = usuarioAtual();
$acao    = (string) ($_GET['acao'] ?? 'listar');
$metodo  = $_SERVER['REQUEST_METHOD'] ?? 'GET';

/** Garante que a pasta é do usuário logado. */
function pastaDoUsuario(int $idPasta, array $usuario): array
{
    $stmt = db()->prepare('SELECT id, nome FROM pastas WHERE id = ? AND id_usuario = ?');
    $stmt->execute([$idPasta, $usuario['id']]);
    $pasta = $stmt->fetch();
    if (!$pasta) {
        responder(404, ['erro' => 'Pasta não encontrada.']);
    }
    return $pasta;
}

if ($metodo === 'GET' && $acao === 'listar') {
    $idPasta = (int) ($_GET['id_pasta'] ?? 0);
    pastaDoUsuario($idPasta, $usuario);

    $stmt = db()->prepare(
        'SELECT p.id, p.nome_comum, p.nome_cientifico, p.confianca, p.foto,
                p.latitude, p.longitude, p.local_descricao, p.achado_em
         FROM plantas_usuario p
         INNER JOIN pasta_plantas pp ON pp.id_planta = p.id
         WHERE pp.id_pasta = ? AND p.id_usuario = ?
         ORDER BY p.achado_em DESC, p.id DESC'
    );
    $stmt->execute([$idPasta, $usuario['id']]);
    $plantas = array_map(static function (array $p): array {
        $p['id']        = (int) $p['id'];
        $p['confianca'] = $p['confianca'] !== null ? (int) $p['confianca'] : null;
        $p['latitude']  = $p['latitude'] !== null ? (float) $p['latitude'] : null;
        $p['longitude'] = $p['longitude'] !== null ? (float) $p['longitude'] : null;
        $p['foto_url']  = urlDaFoto($p['foto']);
        return $p;
    }, $stmt->fetchAll());

    responder(200, ['plantas' => $plantas]);
}

if ($metodo === 'POST' && ($acao === 'adicionar' || $acao === 'remover')) {
    $dados     = corpo();
    $idPasta   = (int) ($dados['id_pasta'] ?? 0);
    $idPlanta  = (int) ($dados['id_planta'] ?? 0);

    pastaDoUsuario($idPasta, $usuario);

    $dono = db()->prepare('SELECT id FROM plantas_usuario WHERE id = ? AND id_usuario = ?');
    $dono->execute([$idPlanta, $usuario['id']]);
    if (!$dono->fetch()) {
        responder(404, ['erro' => 'Planta não encontrada.']);
    }

    if ($acao === 'adicionar') {
        db()->prepare('INSERT IGNORE INTO pasta_plantas (id_pasta, id_planta) VALUES (?, ?)')
            ->execute([$idPasta, $idPlanta]);
        responder(200, ['mensagem' => 'Planta adicionada à pasta.']);
    }

    db()->prepare('DELETE FROM pasta_plantas WHERE id_pasta = ? AND id_planta = ?')
        ->execute([$idPasta, $idPlanta]);
    responder(200, ['mensagem' => 'Planta removida da pasta (continua no histórico).']);
}

responder(405, ['erro' => 'Ação inválida.']);
