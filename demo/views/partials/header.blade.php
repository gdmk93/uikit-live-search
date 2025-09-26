<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title>UIkit Live Search</title>

    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/uikit@3.23.12/dist/css/uikit.min.css"/>
    <script src="https://cdn.jsdelivr.net/npm/uikit@3.23.12/dist/js/uikit.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/uikit@3.23.12/dist/js/uikit-icons.min.js"></script>
    
    <script src="/views/uikit/dist/js/components/live-search.min.js"></script>
</head>
<body>
<nav class="uk-navbar-container">
    <div class="uk-container">
        <div uk-navbar>
            <div class="uk-navbar-left">
                <a class="uk-navbar-item uk-logo" href="/" aria-label="Back to Home">UIkit Live Search</a>

                <ul class="uk-navbar-nav">
                    <li><a href="/pages">Pages</a></li>
                </ul>
            </div>

            <div class="uk-navbar-right">
                <div class="uk-navbar-item">
                    <form id="live-search" action="/search" uk-live-search data-popular='[{"name": "SpongeBob", "type": "character" }, {"name": "Squidward", "type": "character" }, {"name": "Sandy", "type": "character" }, {"name": "Krusty Krab", "type": "building" }, {"name": "Chum Bucket", "type": "building" } ]' class="uk-search uk-search-navbar uk-width-large">
                        <input name="q" class="uk-search-input" type="search" placeholder="Search" aria-label="Search">

                        <div class="uk-position-center-right uk-flex uk-flex-middle">
                            <div uk-spinner="ratio: 0.6;" class="uk-margin-small-right"></div>
                            <button uk-live-search-command="input.clear:focus" type="button" class="uk-live-search-control uk-margin-small-right" uk-icon="close"></button>
                            <button type="submit" class="uk-live-search-control uk-margin-small-right" uk-icon="search"></button>
                        </div>

                        <div id="uk-live-search-result" uk-dropdown="toggle: false; mode: click; targetY: !.uk-navbar-container; boundaryX: !.uk-search; stretch: x;" class="uk-height-max-large uk-padding-remove"></div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</nav>

<div class="uk-container">
    <div class="uk-padding uk-padding-remove-horizontal" uk-height-viewport>