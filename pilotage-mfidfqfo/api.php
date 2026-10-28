<?php
// Cockpit Nobrayn : API de la base partagée (lecture par version, écritures en lot)
require __DIR__ . '/lib.php';
send_security_headers();
header('Content-Type: application/json; charset=utf-8');
start_session();

function out(int $status, array $body): void
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function as_doc($d): array
{
    // json_encode écrirait [] pour un objet vide : on garde un objet
    return is_array($d) ? $d : [];
}

function encode_store(array $s): array
{
    $data = [];
    foreach ($s['data'] as $k => $doc) $data[$k] = $doc === [] ? new stdClass() : $doc;
    return ['v' => $s['v'], 'data' => (object)$data];
}

$user = current_user();
if ($user === null || must_change($user)) out(401, ['code' => 'unauthenticated']);
session_write_close(); // ne bloque pas les autres requêtes de la même session

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $s = store_read();
    $since = isset($_GET['v']) ? (int)$_GET['v'] : -1;
    if ($since === $s['v']) out(200, ['v' => $s['v']]);
    out(200, encode_store($s));
}

if ($method !== 'POST') out(405, ['code' => 'method_not_allowed']);
if (!hash_equals(csrf(), (string)($_SERVER['HTTP_X_COCKPIT_TOKEN'] ?? ''))) out(403, ['code' => 'forbidden']);

$raw = (string)file_get_contents('php://input');
if (strlen($raw) > COCKPIT_MAX_BYTES) out(413, ['code' => 'quota_exceeded']);
$body = json_decode($raw, true);
$ops = is_array($body) ? ($body['ops'] ?? null) : null;
if (!is_array($ops) || !$ops || count($ops) > 200) out(400, ['code' => 'invalid_argument']);

$pathRe = '#^(' . implode('|', COCKPIT_COLLECTIONS) . ')/[A-Za-z0-9_-]{1,64}$#';
foreach ($ops as $op) {
    if (!is_array($op) || !in_array($op['op'] ?? '', ['set', 'update', 'delete'], true)
        || !preg_match($pathRe, (string)($op['path'] ?? ''))
        || ($op['op'] !== 'delete' && !is_array($op['data'] ?? null))) out(400, ['code' => 'invalid_argument']);
}

$lock = fopen(data_dir() . '/store.lock', 'c');
if (!$lock || !flock($lock, LOCK_EX)) out(503, ['code' => 'unavailable']);

$s = store_read();
foreach ($ops as $op) {
    $p = $op['path'];
    if ($op['op'] === 'set') $s['data'][$p] = as_doc($op['data']);
    elseif ($op['op'] === 'update') {
        if (!isset($s['data'][$p])) { flock($lock, LOCK_UN); out(404, ['code' => 'not_found']); }
        $s['data'][$p] = array_merge(as_doc($s['data'][$p]), as_doc($op['data']));
    } else unset($s['data'][$p]);
}
$s['v']++;
$s['at'] = time();
$s['by'] = $user;
$enc = encode_store($s);
if (strlen((string)json_encode($enc)) > COCKPIT_MAX_BYTES) { flock($lock, LOCK_UN); out(413, ['code' => 'quota_exceeded']); }

store_backup();
$saved = write_json(store_file(), ['v' => $s['v'], 'at' => $s['at'], 'by' => $user, 'data' => $enc['data']]);
flock($lock, LOCK_UN);
fclose($lock);
if (!$saved) out(500, ['code' => 'unavailable']);
out(200, $enc);
