<?php
/**
 * Plantas do usuário (histórico).
 *
 * GET  ?acao=historico          → lista as plantas do usuário logado
 *                                  (inclui ids das pastas em que está)
 * POST ?acao=salvar             → salva uma identificação (com foto e local)
 *                                  corpo: { nome_comum, nome_cientifico, confianca,
 *                                           foto?, latitude?, longitude?, local_descricao?,
 *                                           id_pasta? }
 * POST ?acao=remover { id }     → apaga a planta (e a foto no servidor)
 */
declare(strict_types=1);
require __DIR__ . '/comum.php';

$usuario = usuarioAtual();
$acao    = (string) ($_GET['acao'] ?? 'historico');
$metodo  = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// ---------------------------------------------------- histórico
if ($metodo === 'GET' && $acao === 'historico') {
    $stmt = db()->prepare(
        'SELECT p.id, p.nome_comum, p.nome_cientifico, p.confianca, p.foto,
                p.latitude, p.longitude, p.local_descricao, p.achado_em,
                GROUP_CONCAT(pp.id_pasta) AS pastas_ids
         FROM plantas_usuario p
         LEFT JOIN pasta_plantas pp ON pp.id_planta = p.id
         WHERE p.id_usuario = ?
         GROUP BY p.id
         ORDER BY p.achado_em DESC, p.id DESC'
    );
    $stmt->execute([$usuario['id']]);
    $plantas = array_map(static function (array $p): array {
        $p['id']          = (int) $p['id'];
        $p['confianca']   = $p['confianca'] !== null ? (int) $p['confianca'] : null;
        $p['latitude']    = $p['latitude'] !== null ? (float) $p['latitude'] : null;
        $p['longitude']   = $p['longitude'] !== null ? (float) $p['longitude'] : null;
        $p['pastas_ids']  = $p['pastas_ids'] !== null
            ? array_map('intval', explode(',', $p['pastas_ids']))
            : [];
        $p['foto_url']    = urlDaFoto($p['foto']);
        return $p;
    }, $stmt->fetchAll());

    responder(200, ['plantas' => $plantas]);
}

// ------------------------------------------------------ salvar
if ($metodo === 'POST' && $acao === 'salvar') {
    $dados          = corpo();
    $nomeComum      = trim((string) ($dados['nome_comum'] ?? ''));
    $nomeCientifico = trim((string) ($dados['nome_cientifico'] ?? ''));
    $confianca      = isset($dados['confianca']) && $dados['confianca'] !== null
        ? max(0, min(100, (int) $dados['confianca']))
        : null;
    $latitude     = isset($dados['latitude']) ? (float) $dados['latitude'] : null;
    $longitude    = isset($dados['longitude']) ? (float) $dados['longitude'] : null;
    $localDescr   = trim((string) ($dados['local_descricao'] ?? ''));
    $idPasta      = isset($dados['id_pasta']) && $dados['id_pasta'] !== null
        ? (int) $dados['id_pasta']
        : null;

    if ($nomeComum === '' || $nomeCientifico === '') {
        responder(422, ['erro' => 'Informe os nomes da planta.']);
    }

    $arquivo = salvarFotoServidor($dados['foto'] ?? null);

    $stmt = db()->prepare(
        'INSERT INTO plantas_usuario
            (id_usuario, nome_comum, nome_cientifico, confianca, foto,
             latitude, longitude, local_descricao)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $usuario['id'], $nomeComum, $nomeCientifico, $confianca, $arquivo,
        $latitude, $longitude, $localDescr !== '' ? $localDescr : null,
    ]);
    $id = (int) db()->lastInsertId();

    // Se veio pasta, valida que é do usuário e relaciona
    if ($idPasta !== null) {
        $dono = db()->prepare('SELECT id FROM pastas WHERE id = ? AND id_usuario = ?');
        $dono->execute([$idPasta, $usuario['id']]);
        if ($dono->fetch()) {
            db()->prepare('INSERT INTO pasta_plantas (id_pasta, id_planta) VALUES (?, ?)')
                ->execute([$idPasta, $id]);
        }
    }

    $ano = (int) date('Y');
    responder(201, [
        'planta' => [
            'id'              => $id,
            'nome_comum'      => $nomeComum,
            'nome_cientifico' => $nomeCientifico,
            'confianca'       => $confianca,
            'foto_url'        => urlDaFoto($arquivo),
            'latitude'        => $latitude,
            'longitude'       => $longitude,
            'local_descricao' => $localDescr !== '' ? $localDescr : null,
            'achado_em'       => date('Y-m-d H:i:s'),
            'pastas_ids'      => $idPasta !== null ? [$idPasta] : [],
        ],
        'mensagem' => "Planta salva no seu histórico! ($ano)",
    ]);
}

// ---------------------------------------------------- remover
if (($metodo === 'POST' && $acao === 'remover') || $metodo === 'DELETE') {
    $dados = $metodo === 'DELETE' ? $_GET : corpo();
    $id    = (int) ($dados['id'] ?? 0);

    $stmt = db()->prepare('SELECT id, foto FROM plantas_usuario WHERE id = ? AND id_usuario = ?');
    $stmt->execute([$id, $usuario['id']]);
    $planta = $stmt->fetch();
    if (!$planta) {
        responder(404, ['erro' => 'Planta não encontrada.']);
    }

    db()->prepare('DELETE FROM plantas_usuario WHERE id = ?')->execute([$id]);
    apagarFotoServidor($planta['foto']);
    responder(200, ['mensagem' => 'Planta removida.']);
}

responder(405, ['erro' => 'Ação inválida. Use GET ?acao=historico ou POST ?acao=salvar/remover.']);
