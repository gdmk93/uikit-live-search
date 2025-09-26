<?php

// Fuzzy search implementation using Levenshtein distance for matching queries
// Adapted from: https://github.com/agentejo/cockpit/blob/f7cd602bcc6134657ccfeb4e400b0050943dd243/lib/MongoLite/Database.php#L475C1-L525C2
function levenshtein_utf8($s1, $s2) {
    static $map = [];

    $utf8_to_extended_ascii = function($str) use (&$map) {
        $matches = [];

        if (!preg_match_all('/[\xC0-\xF7][\x80-\xBF]+/', $str, $matches)) return $str;

        foreach ($matches[0] as $mbc) {
            if (!isset($map[$mbc])) $map[$mbc] = chr(128 + count($map));
        }

        return strtr($str, $map);
    };

    return levenshtein($utf8_to_extended_ascii($s1), $utf8_to_extended_ascii($s2));
}

function fuzzy_search($search, $text, $distance = 3, $threshold = 0.3) {
    $needles = preg_split('/\s+/u', mb_strtolower(trim($search), 'UTF-8'));
    $tokens = preg_split('/\s+/u', mb_strtolower($text, 'UTF-8'));
    $score = 0;

    foreach ($needles as $needle) {
        if ($needle === '') continue;

        foreach ($tokens as $token) {
            if ($token === '') continue;

            if (strpos($token, $needle) !== false) {
                $score += 1;
                continue;
            }

            $d = levenshtein_utf8($needle, $token);

            if ($d <= $distance) {
                $l = mb_strlen($token, 'UTF-8');
                $matches = max(0, $l - $d);
                $score += ($matches / $l);
            }
        }
    }

    $final = $score / max(1, count($needles));
    return $final >= $threshold ? $final : 0;
}

require __DIR__ . '/vendor/autoload.php';

app()->attachView(Leaf\Blade::class);

app()->blade()->configure([
    'views' => 'views',
    'cache' => 'cache'
]);

// Load data.json once at startup
$dataFile = './data/data.json';

if (!file_exists($dataFile)) {
    die('Error: Data file not found');
}

$data = json_decode(file_get_contents($dataFile), true);

if (json_last_error() !== JSON_ERROR_NONE) {
    die('Error: Invalid JSON in data file');
}

// Home page
app()->get('/', function () {
    return response()->render('home');
});

// Pages list
app()->get('/pages', function () use ($data) {
    return response()->render('pages', [
        'items' => $data
    ]);
});

// Single page by slug
app()->get('/page/{slug}', function ($slug) use ($data) {
    $item = array_filter($data, fn($item) => $item['slug'] === $slug);
    $item = reset($item) ?: null;

    return response()->render('page', $item);
});

// Search endpoint for both standard and live search
app()->match('GET|POST', '/search', function () use ($data) {
    $isLiveSearch = request()->get('live-search') === 'true';
    $q = trim(strip_tags(request()->get('q') ?? ''));
    $defaultTab = 'character';
    $currentTab = mb_strtolower(trim(request()->get('tab') ?? $defaultTab));
    $tabs = array_values(array_unique(array_map('mb_strtolower', array_column($data, 'type'))));

    $items = array_filter($data, function ($item) use ($q, $currentTab) {
        if ($currentTab !== mb_strtolower($item['type'])) {
            return false;
        }

        if (empty($q) || fuzzy_search($q, $item['name']) || fuzzy_search($q, $item['description'])) {
            return true;
        }

        foreach ($item['aliases'] as $alias) {
            if (fuzzy_search($q, $alias)) {
                return true;
            }
        }

        return false;
    });

    return response()->render('search', [
        'q' => $q,
        'isLiveSearch' => $isLiveSearch,
        'defaultTab' => $defaultTab,
        'currentTab' => $currentTab,
        'tabs' => $tabs,
        'items' => array_values($items)
    ]);
});

app()->run();