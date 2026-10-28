<?php
// Cockpit Nobrayn : connexion, changement de mot de passe, puis le cockpit
require __DIR__ . '/lib.php';
send_security_headers();
start_session();

function h(string $s): string { return htmlspecialchars($s, ENT_QUOTES, 'UTF-8'); }
function go(string $to = './'): void { header('Location: ' . $to, true, 303); exit; }

$error = '';
$action = (string)($_POST['action'] ?? '');
$formOk = $action !== '' && hash_equals(csrf(), (string)($_POST['csrf'] ?? ''));

if (isset($_GET['logout']) && hash_equals(csrf(), (string)$_GET['logout'])) {
    $_SESSION = [];
    session_destroy();
    go();
}

if ($action === 'login') {
    $user = strtolower(trim((string)($_POST['user'] ?? '')));
    $user = str_replace(["p'a", 'p’a'], 'pa', $user);
    if (!$formOk) $error = 'La page a expiré, réessaie.';
    elseif (throttle_blocked()) $error = 'Trop d’essais. Réessaie dans 15 minutes.';
    elseif (check_password($user, (string)($_POST['password'] ?? ''))) {
        throttle_record(true);
        session_regenerate_id(true);
        $_SESSION['user'] = $user;
        go();
    } else {
        throttle_record(false);
        usleep(600000);
        $error = 'Identifiant ou mot de passe incorrect.';
    }
}

$me = current_user();

if ($me && $action === 'password') {
    $new = (string)($_POST['new'] ?? '');
    if (!$formOk) $error = 'La page a expiré, réessaie.';
    elseif (!must_change($me) && !check_password($me, (string)($_POST['current'] ?? ''))) $error = 'Mot de passe actuel incorrect.';
    elseif (mb_strlen($new) < 12) $error = 'Au moins 12 caractères.';
    elseif ($new !== (string)($_POST['confirm'] ?? '')) $error = 'Les deux mots de passe ne sont pas identiques.';
    elseif (check_password($me, $new)) $error = 'Choisis un mot de passe différent de l’actuel.';
    elseif (!set_password($me, $new)) $error = 'Enregistrement impossible, réessaie.';
    else { session_regenerate_id(true); go(); }
}

function page(string $title, string $body): void
{
    header('Content-Type: text/html; charset=utf-8');
    echo '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
        . '<meta name="robots" content="noindex, nofollow"><title>' . h($title) . '</title><link rel="icon" href="/favicon.svg">'
        . '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
        . '<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">'
        . '<style>
:root{--bg:#fff;--fg:#0a0a0a;--mute:#6b6b6b;--line:#0a0a0a;--red:#e30613;--field:#f4f4f4}
@media (prefers-color-scheme:dark){:root{--bg:#0a0a0a;--fg:#f5f5f5;--mute:#9a9a9a;--line:#f5f5f5;--field:#161616}}
*{box-sizing:border-box}html,body{margin:0;background:var(--bg);color:var(--fg)}
body{font-family:"Inter Tight",system-ui,sans-serif;min-height:100vh;display:grid;place-items:center;padding:24px 16px}
main{width:100%;max-width:400px}
.logo{font-weight:800;font-size:44px;letter-spacing:-.04em;line-height:1;margin:0 0 6px}
.logo s{text-decoration-color:var(--red);text-decoration-thickness:5px}.logo i{font-style:normal;color:var(--red)}
.k{font-family:"IBM Plex Mono",monospace;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--mute);margin:0 0 40px;border-top:2px solid var(--line);padding-top:10px;display:flex;justify-content:space-between}
h1{font-size:22px;letter-spacing:-.02em;margin:0 0 6px}p{color:var(--mute);margin:0 0 24px;line-height:1.45}
label{display:block;font-family:"IBM Plex Mono",monospace;font-size:12px;text-transform:uppercase;letter-spacing:.06em;margin:0 0 6px}
input{width:100%;font:inherit;font-size:17px;padding:14px;border:0;border-bottom:2px solid var(--line);background:var(--field);color:var(--fg);border-radius:0;margin:0 0 18px;outline:none}
input:focus{border-bottom-color:var(--red)}
button{width:100%;font:inherit;font-weight:700;font-size:17px;padding:16px;border:0;background:var(--red);color:#fff;cursor:pointer;margin-top:6px}
button:hover{filter:brightness(1.08)}
.err{border-left:4px solid var(--red);padding:10px 12px;background:var(--field);color:var(--fg);margin:0 0 20px}
a{color:var(--mute)}
</style></head><body><main><div class="logo">no<s>brayn</s><i>.</i></div><div class="k"><span>Cockpit</span><span>Accès privé</span></div>'
        . $body . '</main></body></html>';
    exit;
}

function err_block(string $e): string { return $e ? '<div class="err" role="alert">' . h($e) . '</div>' : ''; }

if (!$me) {
    page('Cockpit Nobrayn', '<h1>Connexion</h1><p>Réservé à Romain et P’A.</p>' . err_block($error)
        . '<form method="post" autocomplete="on"><input type="hidden" name="action" value="login"><input type="hidden" name="csrf" value="' . h(csrf()) . '">'
        . '<label for="u">Identifiant</label><input id="u" name="user" autocomplete="username" autocapitalize="none" spellcheck="false" required placeholder="romain ou pa">'
        . '<label for="p">Mot de passe</label><input id="p" name="password" type="password" autocomplete="current-password" required>'
        . '<button type="submit">Entrer</button></form>');
}

$forced = must_change($me);
if ($forced || isset($_GET['password'])) {
    $name = COCKPIT_USERS[$me]['name'];
    page('Mot de passe · Cockpit Nobrayn',
        '<h1>' . ($forced ? 'Bienvenue ' . h($name) . '. Choisis ton mot de passe.' : 'Changer mon mot de passe') . '</h1>'
        . '<p>' . ($forced ? 'Le mot de passe provisoire ne sert qu’une fois. ' : '') . 'Au moins 12 caractères. Ton navigateur peut le retenir.</p>' . err_block($error)
        . '<form method="post"><input type="hidden" name="action" value="password"><input type="hidden" name="csrf" value="' . h(csrf()) . '">'
        . '<input type="text" name="user" value="' . h($me) . '" autocomplete="username" hidden>'
        . ($forced ? '' : '<label for="c">Mot de passe actuel</label><input id="c" name="current" type="password" autocomplete="current-password" required>')
        . '<label for="n">Nouveau mot de passe</label><input id="n" name="new" type="password" autocomplete="new-password" minlength="12" required>'
        . '<label for="f">Confirmer</label><input id="f" name="confirm" type="password" autocomplete="new-password" minlength="12" required>'
        . '<button type="submit">Enregistrer</button></form>'
        . ($forced ? '' : '<p style="margin-top:20px"><a href="./">Retour au cockpit</a></p>'));
}

// Le cockpit : page V2 + base partagée hébergée ici
$html = (string)file_get_contents(__DIR__ . '/app.html');
$config = json_encode(['user' => $me, 'csrf' => csrf(), 'api' => 'api.php'], JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT);
$remote = str_replace('__COCKPIT_CONFIG__', $config, (string)file_get_contents(__DIR__ . '/remote.js'));
$patches = [
    "async function boot() {\n  route();" => $remote . "\nasync function boot() {\n  route();\n  if (typeof COCKPIT !== 'undefined') return bootRemote();",
    "new URL('../nobrain/vendor/three.module.min.js', location.href).href" => "new URL('/vendor/three.module.min.js', location.href).href",
    'href="../nobrain/favicon.svg"' => 'href="/favicon.svg"',
    '<span>Cockpit Nobrayn · V2 · données : <span id="modeLabel">—</span></span>' =>
        '<span>Cockpit Nobrayn · V2 · données : <span id="modeLabel">—</span> · <a href="?password=1" style="color:inherit">Mot de passe</a> · <a href="?logout=' . h(csrf()) . '" style="color:inherit">Se déconnecter</a></span>',
    'Ouvrez le cockpit depuis claude.ai, connecté.' => 'Rechargez la page.',
];
foreach ($patches as $from => $to) {
    if (strpos($html, $from) === false) { error_log('cockpit: patch introuvable : ' . substr($from, 0, 60)); continue; }
    $html = str_replace($from, $to, $html);
}
header('Content-Type: text/html; charset=utf-8');
echo $html;
