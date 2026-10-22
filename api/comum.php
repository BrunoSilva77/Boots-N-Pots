<?php
/**
 * Boots'N Pots - utilitários comuns da API
 * Conexão com o banco, CORS, autenticação por token e respostas JSON.
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');

// Preflight do navegador (o app web roda em outra origem: Vite na porta 5173)
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

const DB_HOST = '127.0.0.1';
const DB_NOME = 'bootsnpots';
const DB_USUARIO = 'root';
const DB_SENHA = ''; // XAMPP padrão: sem senha

/** Conexão única (PDO) com o MySQL. */
function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_NOME . ';charset=utf8mb4',
            DB_USUARIO,
            DB_SENHA,
            [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]
        );
    }
    return $pdo;
}

/** Lê o corpo JSON da requisição. */
function corpo(): array
{
    $bruto = file_get_contents('php://input');
    $dados = json_decode($bruto ?: '', true);
    return is_array($dados) ? $dados : [];
}

/** Retorna JSON com status e encerra. */
function responder(int $status, array $dados): never
{
    http_response_code($status);
    echo json_encode($dados, JSON_UNESCAPED_UNICODE);
    exit;
}

/** Lê o header Authorization de qualquer forma que o Apache/PHP expuser. */
function headerAuthorization(): string
{
    if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
        return (string) $_SERVER['HTTP_AUTHORIZATION'];
    }
    if (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        return (string) $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    }
    foreach (['apache_request_headers', 'getallheaders'] as $funcao) {
        if (!function_exists($funcao)) {
            continue;
        }
        foreach ($funcao() as $nome => $valor) {
            if (strcasecmp((string) $nome, 'Authorization') === 0) {
                return (string) $valor;
            }
        }
    }
    return '';
}

/** Valida o token (header Authorization: Bearer ... ou ?token=) e devolve o usuário. */
function usuarioAtual(): array
{
    $token = null;

    $header = headerAuthorization();
    if (preg_match('/Bearer\s+(\S+)/i', $header, $m)) {
        $token = $m[1];
    }
    if ($token === null && isset($_GET['token'])) {
        $token = trim((string) $_GET['token']);
    }
    if ($token === null || $token === '') {
        responder(401, ['erro' => 'Não autenticado. Faça login.']);
    }

    $stmt = db()->prepare('SELECT id, nome, email, avatar FROM usuarios WHERE token = ?');
    $stmt->execute([$token]);
    $usuario = $stmt->fetch();
    if (!$usuario) {
        responder(401, ['erro' => 'Sessão inválida. Faça login novamente.']);
    }
    return $usuario;
}

/**
 * Salva um data URL (data:image/jpeg;base64,...) em uploads/ e
 * devolve o nome do arquivo (ou null se inválido).
 */
function salvarFotoServidor(?string $dataUrl): ?string
{
    if (!$dataUrl || !str_contains($dataUrl, 'base64,')) {
        return null;
    }
    $binario = base64_decode(substr($dataUrl, strpos($dataUrl, ',') + 1), true);
    if ($binario === false || strlen($binario) < 100) {
        return null;
    }
    $info = @getimagesizefromstring($binario);
    if ($info === false) {
        return null;
    }
    $extensao = match ($info['mime']) {
        'image/png'  => 'png',
        'image/webp' => 'webp',
        default      => 'jpg',
    };
    $nome = 'planta_' . bin2hex(random_bytes(8)) . '.' . $extensao;

    $pasta = dirname(__DIR__) . '/uploads';
    if (!is_dir($pasta)) {
        mkdir($pasta, 0777, true);
    }
    if (file_put_contents($pasta . '/' . $nome, $binario) === false) {
        return null;
    }
    return $nome;
}

/** URL pública da foto (usa o mesmo host da requisição → funciona no PC e no celular na LAN). */
function urlDaFoto(?string $arquivo): ?string
{
    if ($arquivo === null || $arquivo === '') {
        return null;
    }
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    return 'http://' . $host . '/bootsnpots/uploads/' . $arquivo;
}

/** Apaga o arquivo da foto do servidor (ignora erros). */
function apagarFotoServidor(?string $arquivo): void
{
    if ($arquivo === null || $arquivo === '') {
        return;
    }
    $caminho = dirname(__DIR__) . '/uploads/' . basename($arquivo);
    if (is_file($caminho)) {
        @unlink($caminho);
    }
}
