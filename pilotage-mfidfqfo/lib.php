<?php
// Cockpit Nobrayn : fonctions communes (comptes, session, stockage).
// Aucune donnée ici : tout est rangé hors du dossier public (voir data_dir()).

// Mots de passe provisoires (hachés). Chacun choisit le sien à la 1re connexion ;
// le nouveau est stocké dans le dossier de données et remplace celui-ci.
const COCKPIT_USERS = [
    'romain' => ['name' => 'Romain', 'hash' => '$2y$11$Ntooy70b9UynP0oVJT3u8u.St.PN4nEyb4nYco2eBWaX83G3Lv1jC'],
    'pa'     => ['name' => "P'A",    'hash' => '$2y$11$1GrR/q2XXkJojoNiqEuOYOYI4UxFYp2osYgxd8yiVoB7RHGBUMS7e'],
];
const COCKPIT_COLLECTIONS = ['tasks', 'milestones', 'objectives', 'products', 'revenue', 'victories', 'players', 'config'];
const COCKPIT_MAX_BYTES = 5000000;
const COCKPIT_SESSION_DAYS = 30;

function data_dir(): string
{
    static $dir = null;
    if ($dir !== null) return $dir;
    $candidates = [];
    $root = rtrim((string)($_SERVER['DOCUMENT_ROOT'] ?? ''), '/');
    if ($root !== '') $candidates[] = dirname($root) . '/nobrayn-cockpit-data'; // hors du web
    $candidates[] = __DIR__ . '/_data'; // repli, protégé par .htaccess
    foreach ($candidates as $c) {
        if ((@is_dir($c) || @mkdir($c, 0700, true)) && @is_writable($c)) { $dir = $c; break; }
    }
    if ($dir === null) { http_response_code(500); exit('Stockage indisponible.'); }
    if (strpos($dir, __DIR__) === 0 && !file_exists($dir . '/.htaccess')) {
        @file_put_contents($dir . '/.htaccess', "Require all denied\n");
    }
    return $dir;
}

function read_json(string $file, $default)
{
    if (!is_file($file)) return $default;
    $j = json_decode((string)file_get_contents($file), true);
    return is_array($j) ? $j : $default;
}

function write_json(string $file, $value): bool
{
    $tmp = $file . '.' . bin2hex(random_bytes(4)) . '.tmp';
    $json = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false || file_put_contents($tmp, $json) === false) return false;
    return rename($tmp, $file);
}

function send_security_headers(): void
{
    header('X-Robots-Tag: noindex, nofollow, noarchive');
    header('X-Frame-Options: DENY');
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: no-referrer');
    header('Cache-Control: no-store');
}

function start_session(): void
{
    $life = COCKPIT_SESSION_DAYS * 86400;
    $dir = data_dir() . '/sessions';
    if (!is_dir($dir)) @mkdir($dir, 0700, true);
    session_save_path($dir);
    ini_set('session.gc_maxlifetime', (string)$life);
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    session_name('nbck');
    $path = rtrim(str_replace('\\', '/', dirname((string)$_SERVER['SCRIPT_NAME'])), '/') . '/';
    session_set_cookie_params(['lifetime' => $life, 'path' => $path, 'secure' => true, 'httponly' => true, 'samesite' => 'Lax']);
    session_start();
    if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(24));
}

function csrf(): string { return (string)$_SESSION['csrf']; }

function current_user(): ?string
{
    $u = $_SESSION['user'] ?? null;
    return is_string($u) && isset(COCKPIT_USERS[$u]) ? $u : null;
}

function user_hashes(): array { return read_json(data_dir() . '/users.json', []); }

function must_change(string $user): bool { return !isset(user_hashes()[$user]['hash']); }

function check_password(string $user, string $password): bool
{
    if (!isset(COCKPIT_USERS[$user])) { password_verify($password, COCKPIT_USERS['romain']['hash']); return false; }
    $saved = user_hashes()[$user]['hash'] ?? null;
    return password_verify($password, $saved ?: COCKPIT_USERS[$user]['hash']);
}

function set_password(string $user, string $password): bool
{
    $file = data_dir() . '/users.json';
    $all = read_json($file, []);
    $all[$user] = ['hash' => password_hash($password, PASSWORD_DEFAULT), 'at' => time()];
    return write_json($file, $all);
}

// Anti-force brute : 5 échecs en 15 min par adresse IP = 15 min de blocage
function throttle_blocked(): bool
{
    $t = read_json(data_dir() . '/throttle.json', []);
    $k = hash('sha256', (string)($_SERVER['REMOTE_ADDR'] ?? ''));
    return isset($t[$k]) && $t[$k]['n'] >= 5 && time() - $t[$k]['t'] < 900;
}

function throttle_record(bool $ok): void
{
    $file = data_dir() . '/throttle.json';
    $t = read_json($file, []);
    $k = hash('sha256', (string)($_SERVER['REMOTE_ADDR'] ?? ''));
    foreach ($t as $key => $row) if (time() - $row['t'] > 3600) unset($t[$key]);
    if ($ok) unset($t[$k]);
    else {
        $n = (isset($t[$k]) && time() - $t[$k]['t'] < 900) ? $t[$k]['n'] + 1 : 1;
        $t[$k] = ['n' => $n, 't' => time()];
    }
    write_json($file, $t);
}

// Base partagée : un seul fichier JSON versionné + une sauvegarde par jour (30 gardées)
function store_file(): string { return data_dir() . '/store.json'; }

function store_read(): array
{
    $s = read_json(store_file(), ['v' => 0, 'data' => []]);
    if (!isset($s['data']) || !is_array($s['data'])) $s['data'] = [];
    $s['v'] = (int)($s['v'] ?? 0);
    return $s;
}

function store_backup(): void
{
    $dir = data_dir() . '/backups';
    if (!is_dir($dir)) @mkdir($dir, 0700, true);
    $today = $dir . '/store-' . date('Y-m-d') . '.json';
    if (!is_file($today) && is_file(store_file())) @copy(store_file(), $today);
    $files = glob($dir . '/store-*.json') ?: [];
    sort($files);
    while (count($files) > 30) @unlink(array_shift($files));
}
